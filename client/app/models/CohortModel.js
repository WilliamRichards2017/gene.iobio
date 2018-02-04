class CohortModel {

  constructor(endpoint, genericAnnotation, translator, geneModel, cacheHelper, genomeBuildHelper, freebayesSettings) {

    this.endpoint = endpoint;
    this.genericAnnotation = genericAnnotation;
    this.translator = translator;
    this.geneModel = geneModel;
    this.cacheHelper = cacheHelper;
    this.genomeBuildHelper = genomeBuildHelper;
    this.freebayesSettings = freebayesSettings;
    this.filterModel = null;

    this.annotationScheme = 'vep';

    this.isLoaded = false;

    this.sampleModels  = [];
    this.sampleMap = {};

    this.demoVcf = "https://s3.amazonaws.com/iobio/samples/vcf/platinum-exome.vcf.gz";
    this.demoBams = {
      'proband': 'https://s3.amazonaws.com/iobio/samples/bam/NA12878.exome.bam',
      'mother':  'https://s3.amazonaws.com/iobio/samples/bam/NA12892.exome.bam',
      'father':  'https://s3.amazonaws.com/iobio/samples/bam/NA12891.exome.bam'
    }
    this.mode = 'single';
    this.maxAlleleCount = null;
    this.affectedInfo = null;
    this.maxDepth = 0;


    this.inProgress = {
      'loadingDataSources': false
    };

   }

  promiseInitDemo() {
    let self = this;

    self.isLoaded = false;

    self.inProgress.loadingDataSources = true;

    return new Promise(function(resolve, reject) {
      self.sampleModels = [];
      self.mode = 'trio';

      self.promiseAddDemoSample('proband', 'NA12878')
      .then(function(sample) {

        self.promiseAddDemoSample('mother', 'NA12892')
        .then(function(sample) {

          self.promiseAddDemoSample('father', 'NA12891')
          .then(function(sample) {

            self.promiseAddClinvarSample()
            .then(function(sample) {

              self.setAffectedInfo();
              self.inProgress.loadingDataSources = false;
              self.isLoaded = true;

              resolve(self.sampleModels);
            })
            .catch(function(error) {
              self.inProgress.loadingDataSources = false;
              reject(error);
            })
          })
        })
      })

    })
  }

  promiseInit(modelInfos) {
    let self = this;

    self.isLoaded = false;
    self.inProgress.loadingDataSources = true;

    return new Promise(function(resolve, reject) {
      self.sampleModels = [];
      self.mode = modelInfos.length > 1 ? 'trio': 'single';

      let idx = 0;

      self.addNextSample(modelInfos, idx,
      function(error) {
        reject(error);
      });

      self.promiseAddClinvarSample()
      .then(function(sample) {

        self.setAffectedInfo();
        self.inProgress.loadingDataSources = false;
        self.isLoaded = true;

        resolve();
      })
      .catch(function(error) {
        reject(error);
      })
    })
  }


  addNextSample(modelInfos, idx, errorCallback) {
    let self = this;
    if (idx >= modelInfos.length) {
      return;
    } else {
      self.promiseAddSample(modelInfos[idx])
      .then(function() {
        idx++;
        self.addNextSample(modelInfos, idx, errorCallback)
      })
      .catch(function(error) {
        if (errorCallback) {
          errorCallback(error);
        }
      })
    }
  }

  promiseAddSample(modelInfo) {
    let self = this;
    return new Promise(function(resolve,reject) {
      var vm = new SampleModel();
      vm.init(self);
      vm.setRelationship(modelInfo.relationship);

      var vcfPromise = null;
      if (modelInfo.vcf) {
        vcfPromise = new Promise(function(vcfResolve, vcfReject) {
          vm.onVcfUrlEntered(modelInfo.vcf, modelInfo.tbi, function() {
            vm.setSampleName(modelInfo.sample);
            vm.setName(modelInfo.relationship + " " + modelInfo.sample)
            vcfResolve();
          })
        },
        function(error) {
          vcfReject(error);
        });
      } else {
        vcfPromise = Promise.resolve();
      }


      var bamPromise = null;
      if (modelInfo.bam) {
        bamPromise = new Promise(function(bamResolve, bamReject) {
          vm.onBamUrlEntered(modelInfo.bam, modelInfo.bai, function() {
            bamResolve();
          })
        },
        function(error) {
          bamReject(error);
        });
      } else {
        bamPromise = Promise.resolve();
      }

      Promise.all([vcfPromise, bamPromise])
      .then(function() {

        self.sampleModels.push(vm);
        let theModel = {'relationship': modelInfo.relationship, 'model': vm};
        self.sampleMap[modelInfo.relationship] = theModel;
        resolve();
      })

    })
  }


  promiseAddDemoSample(rel, sampleName) {
    let self = this;
    return new Promise(function(resolve,reject) {
      var vm = new SampleModel();
      vm.init(self);
      vm.setRelationship(rel);
      vm.onVcfUrlEntered(self.demoVcf, null, function() {
        vm.setSampleName(sampleName);
        vm.setName(rel + " " + sampleName)
        vm.onBamUrlEntered(self.demoBams[rel], null, function() {

          self.sampleModels.push(vm);

          let sample = {'relationship': rel, 'model': vm};
          self.sampleMap[rel] = sample;

          resolve(sample);
        })
      },
      function(error) {
        reject(error);
      });

    })
  }

  promiseAddClinvarSample() {
    let self = this;
    return new Promise(function(resolve,reject) {
      var vm = new SampleModel();
      vm.init(self);
      vm.setRelationship('known-variants');
      vm.setName('Clinvar')
      var clinvarUrl = self.genomeBuildHelper.getBuildResource(self.genomeBuildHelper.RESOURCE_CLINVAR_VCF_S3);
      vm.onVcfUrlEntered(clinvarUrl, null, function() {
        self.sampleModels.push(vm);

        var sample = {'relationship': 'known-variants', 'model': vm};
        self.sampleMap['known-variants'] = sample;

        resolve(sample);
      },
      function(error) {
        reject(error);
      });

    })
  }



  setAffectedInfo(forceRefresh) {
    let self = this;
    if (self.affectedInfo == null || forceRefresh) {
      self.affectedInfo = [];
      for (var rel in self.sampleMap) {
        var model = self.sampleMap[rel].model;
        if (model && model.getRelationship() != 'known-variants') {
          var info = {};
          info.model = model;
          info.relationship = model.getRelationship();
          info.status = model.isAffected() ? 'affected' : 'unaffected';
          info.label  = model.getRelationship();

          info.id = info.status + "-_-" + model.getRelationship() + "-_-" + model.getSampleName();

          self.affectedInfo.push(info);
        }
      }
      /*
      var sibIdx = 0;
      for (var status in variantCardsSibs) {
        var sibs = variantCardsSibs[status];
        sibs.forEach(function(vc) {
          var info = {};
          info.relationship = vc.getRelationship();
          info.status = status;
          info.variantCard = vc;
          info.label = vc.getRelationship() + " " + vc.getSampleName();
          info.id = info.status + "-_-" + vc.getRelationship() + "-_-" + vc.getSampleName();

          window.affectedInfo.push(info);
        })
      }
      */

    }
  }


  getProbandModel() {
    return this.sampleMap['proband'].model;
  }

  getModel(relationship) {
    return this.sampleMap[relationship].model;
  }

  getCanonicalModels() {
    return this.sampleModels.filter(function(model) {
      return model.relationship != 'known-variants';
    })
  }



  isAlignmentsOnly(callback) {
    var theModels = this.sampleModels.filter(function(model) {
      return model.isAlignmentsOnly();
    });
    return theModels.length == this.sampleModels.length;
  }


  samplesInSingleVcf() {
    var theVcfs = {};
    var cards = this.sampleModels.forEach(function(model) {
      if (!model.isAlignmentsOnly() && model.getRelationship() != 'known-variants') {
        if (model.vcfUrlEntered) {
          theVcfs[model.vcf.getVcfURL()] = true;
        } else {
          theVcfs[model.vcf.getVcfFile().name] = true;
        }

      }
    });
    return Object.keys(theVcfs).length == 1;
  }


  promiseLoadData(theGene, theTranscript, options) {
    let self = this;
    let promises = [];

    return new Promise(function(resolve, reject) {
      if (Object.keys(self.sampleMap).length == 0) {
        resolve();
      } else {
        self.clearLoadedData();

        let cohortResultMap = null;

        let p1 = self.promiseLoadVariants(theGene, theTranscript, options)
        .then(function(data) {
          cohortResultMap = data.resultMap;
          self.setLoadedVariants(data.gene);
        })
        promises.push(p1);

        let p2 = self.promiseLoadCoverage(theGene, theTranscript)
        .then(function() {
          self.setCoverage();
        })
        promises.push(p2);

        Promise.all(promises)
        .then(function() {
            // Now summarize the danger for the selected gene
            self.promiseSummarizeDanger(theGene, theTranscript, cohortResultMap.proband, null)
            .then(function() {
              resolve();
            })
        })
        .catch(function(error) {
          reject(error);
        })

      }

    })
  }

  promiseLoadKnownVariants(theGene, theTranscript) {
    let self = this;
    self.getModel('known-variants').inProgress.loadingVariants = true;
    self.sampleMap['known-variants'].model.promiseAnnotateVariants(theGene, theTranscript, [self.sampleMap['known-variants'].model], false, false)
    .then(function(resultMap) {
      self.getModel('known-variants').inProgress.loadingVariants = false;
      self.setLoadedVariants(theGene, 'known-variants');
    })
  }

  promiseLoadVariants(theGene, theTranscript, options) {
    let self = this;

    return new Promise(function(resolve, reject) {
      self.promiseAnnotateVariants(theGene, theTranscript, self.mode == 'trio' && self.samplesInSingleVcf(), false, options)
      .then(function(resultMap) {
        // the variants are fully annotated so determine inheritance (if trio).
        return self.promiseAnnotateInheritance(theGene, theTranscript, resultMap, {isBackground: false, cacheData: true})
      })
      .then(function(resultMap) {
        resolve(resultMap);
      })
      .catch(function(error) {
        reject(error);
      })
    })

  }
  promiseLoadCoverage(theGene, theTranscript) {
    let self = this;

    return new Promise(function(resolve, reject) {

      self.promiseGetCachedGeneCoverage(theGene, theTranscript, true)
      .then(function(data) {
        return self.promiseLoadBamDepth(theGene, theTranscript);
      })
      .then(function(data) {
        resolve(data);
      })
      .catch(function(error) {
        reject(error);
      })
    })

  }


  clearLoadedData() {
    let self = this;
    self.sampleModels.forEach(function(model) {
      model.loadedVariants = {loadState: {}, features: [], maxLevel: 1, featureWidth: 0};
      model.coverage = [[]];
    });
  }

  setLoadedVariants(gene, relationship=null) {
    let self = this;
    self.sampleModels.forEach(function(model) {
      if (relationship == null || relationship == model.relationship) {
        if (model.vcfData && model.vcfData.features) {
          var loadedVariants = $.extend({}, model.vcfData);
          loadedVariants.features = model.vcfData.features.filter( function(feature) {
            var loaded = feature.fbCalled == null;
            var inRegion = true;
            if (self.filterModel.regionStart && self.filterModel.regionEnd) {
              inRegion = feature.start >= self.filterModel.regionStart && feature.start <= self.filterModel.regionEnd;
            }
            var passesModelFilter = self.filterModel.passesModelFilter(model.relationship, feature);
            return loaded && inRegion && passesModelFilter;
          });

          var start = self.filterModel.regionStart ? self.filterModel.regionStart : gene.start;
          var end   = self.filterModel.regionEnd   ? self.filterModel.regionEnd   : gene.end;
          var pileupObject = model._pileupVariants(loadedVariants.features, start, end);
          loadedVariants.maxLevel = pileupObject.maxLevel + 1;
          loadedVariants.featureWidth = pileupObject.featureWidth;

          model.loadedVariants = loadedVariants;

        } else {
          model.loadedVariants = {loadState: {}, features: []};
        }

      }
    })
  }

  setCoverage(regionStart, regionEnd) {
    let self = this;
    self.getCanonicalModels().forEach(function(model) {
      if (model.bamData) {
        if (regionStart && regionEnd) {
          model.coverage = model.bamData.coverage.filter(function(depth) {
            return depth[0] >= regionStart && depth[0] <= regionEnd;
          })
        } else {
          model.coverage = model.bamData.coverage;
        }

        if (model.coverage) {
          var max = d3.max(model.coverage, function(d,i) { return d[1]});
          if (max > self.maxDepth) {
            self.maxDepth = max;
          }
        }
      }
    })
  }

  promiseAnnotateVariants(theGene, theTranscript, isMultiSample, isBackground, options={}) {
    let self = this;
    return new Promise(function(resolve, reject) {
      var annotatePromises = [];
      var theResultMap = {};
      if (isMultiSample) {
        self.getCanonicalModels().forEach(function(model) {
          model.inProgress.loadingVariants = true;
        })
        p = self.sampleMap['proband'].model.promiseAnnotateVariants(theGene, theTranscript, self.getCanonicalModels(), isMultiSample, isBackground)
        .then(function(resultMap) {
          self.getCanonicalModels().forEach(function(model) {
            model.inProgress.loadingVariants = false;
          })
          theResultMap = resultMap;
        })
        annotatePromises.push(p);
      } else {
        for (var rel in self.sampleMap) {
          var model = self.sampleMap[rel].model;
          model.inProgress.loadingVariants = true;
          if (model.isVcfReadyToLoad() || vc.model.isLoaded()) {
            if (rel != 'known-variants') {
              var p = model.promiseAnnotateVariants(theGene, theTranscript, [model], isMultiSample, isBackground)
              .then(function(resultMap) {
                self.getModel(rel).inProgress.loadingVariants = false;
                for (var rel in resultMap) {
                  theResultMap[rel] = resultMap[rel];
                }
              })
              annotatePromises.push(p);
            }
          }
        }
      }


      if (options.getKnownVariants) {
        self.getModel('known-variants').inProgress.loadingVariants = true;
        let p = self.sampleMap['known-variants'].model.promiseAnnotateVariants(theGene, theTranscript, [self.sampleMap['known-variants'].model], false, isBackground)
        .then(function(resultMap) {
          self.getModel('known-variants').inProgress.loadingVariants = false;
          for (var rel in resultMap) {
            theResultMap[rel] = resultMap[rel];
          }
        })
        annotatePromises.push(p);
      }


      Promise.all(annotatePromises)
      .then(function() {

        self.promiseAnnotateWithClinvar(theResultMap, theGene, theTranscript, isBackground)
        .then(function(data) {
          resolve(data)
        })

      });
    })
  }




  promiseAnnotateWithClinvar(resultMap, geneObject, transcript, isBackground) {
    let self = this;
    var formatClinvarKey = function(variant) {
      var delim = '^^';
      return variant.chrom + delim + variant.ref + delim + variant.alt + delim + variant.start + delim + variant.end;
    }

    var formatClinvarThinVariant = function(key) {
      var delim = '^^';
      var tokens = key.split(delim);
      return {'chrom': tokens[0], 'ref': tokens[1], 'alt': tokens[2], 'start': tokens[3], 'end': tokens[4]};
    }



    var refreshVariantsWithClinvarLookup = function(theVcfData, clinvarLookup) {
      theVcfData.features.forEach(function(variant) {
        var clinvarAnnot = clinvarLookup[formatClinvarKey(variant)];
        if (clinvarAnnot) {
          for (var key in clinvarAnnot) {
            variant[key] = clinvarAnnot[key];
          }
        }
      })
      if (theVcfData.loadState == null) {
        theVcfData.loadState = {};
      }
      theVcfData.loadState['clinvar'] = true;
    }



    return new Promise(function(resolve, reject) {

      // Combine the trio variants into one set of variants so that we can access clinvar once
      // instead of on a per sample basis
      var uniqueVariants = {};
      var unionVcfData = {features: []}
      for (var rel in resultMap) {
        var vcfData = resultMap[rel];
        if (!vcfData.loadState['clinvar'] && rel != 'known-variants') {
         vcfData.features.forEach(function(feature) {
            uniqueVariants[formatClinvarKey(feature)] = true;
         })
        }
      }
      if (Object.keys(uniqueVariants).length == 0) {
        resolve(resultMap);
      } else {

        for (var key in uniqueVariants) {
          unionVcfData.features.push(formatClinvarThinVariant(key));
        }

        var refreshVariantsFunction = isClinvarOffline || clinvarSource == 'vcf'
          ? self.getProbandModel()._refreshVariantsWithClinvarVCFRecs.bind(self.getProbandModel(), unionVcfData)
          : self.getProbandModel()._refreshVariantsWithClinvarEutils.bind(self.getProbandModel(), unionVcfData);

        self.getProbandModel().vcf.promiseGetClinvarRecords(
            unionVcfData,
            self.getProbandModel()._stripRefName(geneObject.chr),
            geneObject,
            self.geneModel.clinvarGenes,
            refreshVariantsFunction)
        .then(function() {

            // Create a hash lookup of all clinvar variants
            var clinvarLookup = {};
            unionVcfData.features.forEach(function(variant) {
              var clinvarAnnot = {};

              for (var key in self.getProbandModel().vcf.getClinvarAnnots()) {
                  clinvarAnnot[key] = variant[key];
                  clinvarLookup[formatClinvarKey(variant)] = clinvarAnnot;
              }
            })

            var refreshPromises = [];

            // Use the clinvar variant lookup to initialize variants with clinvar annotations
            for (var rel in resultMap) {
              var vcfData = resultMap[rel];
              if (!vcfData.loadState['clinvar']) {
                var p = refreshVariantsWithClinvarLookup(vcfData, clinvarLookup);
                if (!isBackground) {
                  self.getModel(rel).vcfData = vcfData;
                }
                //var p = getVariantCard(rel).model._promiseCacheData(vcfData, CacheHelper.VCF_DATA, vcfData.gene.gene_name, vcfData.transcript);
                refreshPromises.push(p);
              }
            }

            Promise.all(refreshPromises)
            .then(function() {
              resolve(resultMap);
            })
            .catch(function(error) {
              reject(error);
            })

        })
      }


    })
  }

  promiseAnnotateInheritance(geneObject, theTranscript, resultMap, options={isBackground: false, cacheData: true}) {
    let self = this;

    var resolveIt = function(resolve, resultMap, geneObject, theTranscript, options) {

      // Now that inheritance mode has been determined, we can assess each variant's impact
      self.sampleModels.forEach(function(model) {
        if (resultMap[model.getRelationship()]) {
          model.assessVariantImpact(resultMap[model.getRelationship()], theTranscript);
        }
      })


      self.promiseCacheCohortVcfData(geneObject, theTranscript, CacheHelper.VCF_DATA, resultMap, options.cacheData)
      .then(function() {
        resolve({'resultMap': resultMap, 'gene': geneObject, 'transcript': theTranscript});
      })

    }

    return new Promise(function(resolve,reject) {

      if (self.isAlignmentsOnly() && !autocall && (resultMap == null || resultMap.proband == null)) {
          resolve({'resultMap': {'proband': {features: []}}, 'gene': geneObject, 'transcript': theTranscript});
      } else {


        if (self.mode == 'single') {
          // Determine harmful variants, cache data, etc.
          resolveIt(resolve, resultMap, geneObject, theTranscript, options);
        } else {

          // Set the max allele count across all variants in the trio.  We use this to properly scale
          // the allele counts bars in the tooltip
          self.maxAlleleCount = 0;
          for(var rel in resultMap) {
            self.maxAlleleCount = SampleModel.calcMaxAlleleCount(resultMap[rel], self.maxAlleleCount);
          }


          // We only pass in the affected info if we need to sync up genotypes because samples
          // where in separate vcf files
          var affectedInfoToSync = self.isAlignmentsOnly() || self.samplesInSingleVcf() ? null : self.affectedInfo;

          var trioModel = new VariantTrioModel(resultMap.proband, resultMap.mother, resultMap.father, null, affectedInfoToSync);

          // Compare the mother and father variants to the proband, setting the inheritance
          // mode on the proband's variants
          trioModel.compareVariantsToMotherFather(function() {

            // Now set the affected status for the family on each variant of the proband
            self.getProbandModel().determineAffectedStatus(resultMap.proband, geneObject, theTranscript, self.affectedInfo, function() {

              // Determine harmful variants, cache data, etc.
              resolveIt(resolve, resultMap, geneObject, theTranscript, options);

            });


          })
        }

      }


    })

  }


  promiseCacheCohortVcfData(geneObject, theTranscript, dataKind, resultMap, cacheIt) {
    let self = this;
    return new Promise(function(resolve, reject) {
      // Cache vcf data for trio
      var cachePromise = null;
      if (cacheIt) {
        var cachedPromises = [];
        self.sampleModels.forEach(function(model) {
          if (resultMap[model.getRelationship()]) {
            var p = model._promiseCacheData(resultMap[model.getRelationship()], dataKind, geneObject.gene_name, theTranscript);
            cachedPromises.push(p);
          }
        })
        Promise.all(cachedPromises).then(function() {
          resolve();
        })
      } else {
        resolve();
      }

    })

  }

  promiseSummarizeError(error) {
    let self = this;
    return new Promise(function(resolve, reject) {
      self.getProbandModel().promiseSummarizeError(error.geneName, error.message)
      .then(function(dangerObject) {
          self.geneModel.setDangerSummary(geneObject, dangerObject);
          resolve();
      }).
      catch(function(error) {
        reject(error);
      })
    })
  }

  promiseSummarizeDanger(geneObject, theTranscript, probandVcfData, options) {
    let self = this;

    return new Promise(function(resolve, reject) {

      self.promiseGetCachedGeneCoverage(geneObject, theTranscript, false)
      .then(function(data) {

        var geneCoverageAll = data.geneCoverage;

        self.getProbandModel().promiseGetDangerSummary(geneObject.gene_name)
        .then(function(dangerSummary) {

            // Summarize the danger for the gene based on the filtered annotated variants and gene coverage
            var filteredVcfData = null;
            var filteredFbData = null;
            if (probandVcfData.features && probandVcfData.features.length > 0) {
              filteredVcfData = self.getProbandModel().filterVariants(probandVcfData, self.filterModel.getFilterObject(), geneObject.start, geneObject.end, true);
              filteredFbData  = self.getProbandModel().reconstituteFbData(filteredVcfData);
            } else if (probandVcfData.features) {
              filteredVcfData = probandVcfData;
            }
            var theOptions = $.extend({}, options);
            if ((dangerSummary && dangerSummary.CALLED) || (filteredFbData && filteredFbData.features.length > 0)) {
                theOptions.CALLED = true;
            }

            return self.getProbandModel().promiseSummarizeDanger(geneObject.gene_name, filteredVcfData, theOptions, geneCoverageAll, self.filterModel);
        })
        .then(function(theDangerSummary) {
          self.geneModel.setDangerSummary(geneObject, theDangerSummary);
          resolve();
        })
        .catch(function(error) {
          var msg = "An error occurred in promiseSummarizeDanger() when calling SampleModel.promiseGetDangerSummary(): " + error;
          console.log(msg);
          reject(msg);
        })


      })
      .catch(function(error) {
        var msg = "An error occurred in CohortModel.promiseSummarizeDanger() when calling promiseGetCachedGeneCoverage(): " + error;
        console.log(msg);
        reject(msg);
      });

    });


  }


  promiseGetCachedGeneCoverage(geneObject, transcript, showProgress = false) {
    let self = this;
    return new Promise(function(resolve, reject) {
      var geneCoverageAll = {gene: geneObject, transcript: transcript, geneCoverage: {}};

      var promises = [];
      self.sampleModels.forEach(function(model) {
        if (model.isBamLoaded()) {
          if (showProgress) {
            //vc.showBamProgress("Analyzing coverage in coding regions");
          }
          var promise = model.promiseGetGeneCoverage(geneObject, transcript)
           .then(function(data) {
            var gc = data.geneCoverage;
            geneCoverageAll.geneCoverage[data.model.getRelationship()] = gc;
            if (showProgress) {
              //getVariantCard(data.model.getRelationship()).endBamProgress();
            }
           })
           .catch(function(error) {
            reject(error);
           })
          promises.push(promise);
        }

      })
      Promise.all(promises).then(function() {
        resolve(geneCoverageAll);
      })
    })

  }

  promiseLoadBamDepth(theGene, theTranscript) {
    let self = this;

    return new Promise(function(resolve, reject) {
      let promises = [];
      let theResultMap = {};
      self.getCanonicalModels().forEach(function(model) {
        if (model.isBamLoaded()) {
          model.inProgress.loadingCoverage = true;
          var p =  new Promise(function(innerResolve, innerReject) {
            var theModel = model;
            theModel.getBamDepth(theGene, theTranscript, function(coverageData) {
              theModel.inProgress.loadingCoverage = false;
              theResultMap[theModel.relationship] = coverageData;
              innerResolve();
            });
          })
          promises.push(p);

        }
      })

      Promise.all(promises)
      .then(function() {
        resolve(theResultMap);
      })

    })

  }

  promiseMarkCodingRegions(geneObject, transcript) {
    let self = this;
    return new Promise(function(resolve, reject) {

      var exonPromises = [];
      transcript.features.forEach(function(feature) {
        if (!feature.hasOwnProperty("danger")) {
          feature.danger = {proband: false, mother: false, father: false};
        }
        if (!feature.hasOwnProperty("geneCoverage")) {
          feature.geneCoverage = {proband: false, mother: false, father: false};
        }


        self.getCanonicalModels().forEach(function(model) {
          var promise = model.promiseGetCachedGeneCoverage(geneObject, transcript)
           .then(function(geneCoverage) {
              if (geneCoverage) {
                var matchingFeatureCoverage = geneCoverage.filter(function(gc) {
                  return feature.start == gc.start && feature.end == gc.end;
                });
                if (matchingFeatureCoverage.length > 0) {
                  var gc = matchingFeatureCoverage[0];
                  feature.geneCoverage[model.getRelationship()] = gc;
                  feature.danger[model.getRelationship()] = self.filterModel.isLowCoverage(gc);
                } else {
                  feature.danger[model.getRelationship()]  = false;
                }
              } else {
                feature.danger[model.getRelationship()] = false;
              }

           })
          exonPromises.push(promise);
        })
      })

      Promise.all(exonPromises).then(function() {
        var sortedExons = self.geneModel._getSortedExonsForTranscript(transcript);
        self.geneModel._setTranscriptExonNumbers(transcript, sortedExons);
        resolve({'gene': geneObject, 'transcript': transcript});
      });
    })

  }


}

export default CohortModel;
