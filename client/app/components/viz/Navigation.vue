<style lang="sass">

@import ../../../assets/sass/variables

aside.navigation-drawer
  margin-top: 45px !important
  z-index: 0
  padding-bottom: 0px

  #side-panel-container
    display: flex
    flex-flow: column
    flex: 1 1 auto
    justify-content: space-between
    margin-bottom: 0px
    padding-bottom: 0px
    height: calc(100% - 10px)
    overflow-y: scroll

    #flagged-variants-card
      flex-grow: 1

    #legend-card
      margin-top: 5px
      margin-bottom: 38px
      padding: 0px

nav.toolbar
  -webkit-box-shadow: 0px 2px 4px -1px rgba(0, 0, 0, 0.13), 0px 4px 5px 0px rgba(0, 0, 0, 0.06), 0px 1px 10px 0px rgba(0,0,0,0.12)
  box-shadow: 0px 2px 4px -1px rgba(0, 0, 0, 0.13), 0px 4px 5px 0px rgba(0, 0, 0, 0.06), 0px 1px 10px 0px rgba(0,0,0,0.12)

  background-color: $nav-color !important
  font-weight: 300 !important

  .toolbar__title
    color: $nav-title-color
    font-weight:  600
  .btn
    color: $nav-text-color

  #gene-name-input
    .input-group--text-field.input-group--prepend-icon
      .input-group__prepend-icon
        padding-right: 13px

  #search-or
    display: inline-block
    padding-top: 16px
    margin-left: 10px
    margin-right: 16px

  #phenotype-input, #gene-name-input, #phenolyzer-top-input
    .input-group input
      color: $nav-text-color
    .input-group
      padding: 10px 0 0
    .input-group
      label
        font-size: 13px
        line-height: 25px
        height: 25px
        top: 14px
    .input-group__input
      min-height: 0px
      margin-top: 13px
    .input-group--text-field input
      font-size: 13px
      height: 24px
    .input-group
      padding-top: 0px
    .input-group__selections__comma
      font-size: 13px
    .input-group__details:before
      background-color: $nav-text-color
    .input-group__details:after
      background-color: $nav-text-color

  #phenolyzer-top-input
    .input-group__input
      height: 20px
  .primary--text input, .primary--text textarea
    caret-color: $nav-text-color !important

    i.material-icons
      color:  $nav-text-color-clin !important

    .toolbar__title
      color:  $nav-text-color-clin

  .toolbar__side-icon.btn.btn--icon
    max-width: 40px
    min-width: 40px

  .toolbar__items
    width: 60%

  .btn
    margin: 0px
    min-width: 78px

    .btn__content
      padding: 0 0px


  i.material-icons
    margin-right: 2px
    color:  $nav-text-color !important

  .toolbar__title
    font-family: Quicksand
    font-size: 24px
    margin-right: 5px
    margin-left: 5px
    padding-bottom: 5px
    min-width: 130px

  #phenotype-input, #gene-name-input, #phenolyzer-top-input
    label
      color: $nav-text-color !important
    .material-icons
      color: $nav-text-color !important
    .input-group__selections__comma
      color: $nav-text-color !important

  #gene-name-input
    width: 130px
    margin-left: 20px

  #search-phenotype-button
    background-color: #ffffff1f
    min-width: 70px

    .btn__content
      padding: 0px

  &.clin
    background-color: $nav-color-clin !important

    .btn
      color: $nav-text-color-clin

    #phenotype-input, #gene-name-input, #phenolyzer-top-input
      label
        color: $nav-text-color-clin !important
      .material-icons
        color: $nav-text-color-clin !important
      .input-group__selections__comma
        color: $nav-text-color-clin !important

    #phenotype-input, #gene-name-input, #phenolyzer-top-input
      .input-group input
        color: $nav-text-color-clin !important
      .input-group__details:before
        background-color: $nav-text-color-clin !important
      .input-group__details:after
        background-color: $nav-text-color-clin !important

    .toolbar__title
      color: $nav-text-color-clin !important

    i.material-icons
      color:  $nav-text-color-clin !important

#versions
  font-size: 14px
  color:  rgb(132,132,132)
  padding-top: 5px
  margin-bottom: 20px !important

  div
    margin-bottom: 0px !important
    clear: both

    .version-label
      width: 230px
      float: left
      padding-right: 5px
      clear: none
      padding-bottom: 7px
      color: #717171
      font-weight: 600
      font-size: 13px !important

    .number
      width: 220px
      float: left
      padding-bottom: 7px
      clear: none
      font-size: 13px !important

#credits
  font-size: 12px

.citation-title
  margin-bottom: 0px !important
  margin-top: 5px !important
  font-size: 12px
  color: #717171
  font-weight: 600
  clear: both

.mode-switch

  label
    padding-left: 7px
    line-height: 18px
    font-size: 12px
    font-weight: bold
    padding-top: 2px
    color: $nav-text-color

</style>

<template>
  <div>
    <v-toolbar fixed height="50"   dark  :class="launchedFromClin ? 'clin' : '' " >

      <v-toolbar-side-icon @click.stop="leftDrawer = !leftDrawer">
      </v-toolbar-side-icon>


      <v-toolbar-title v-text="title">
      </v-toolbar-title>


      <v-spacer></v-spacer>


      <v-toolbar-items  class="hidden-sm-and-down" style="padding-top:3px">


        <span id="gene-name-input"  style="display:inline-block">
          <v-text-field id="search-gene-name"
          :class="clazzAttention"
          :hide-details="true"
          v-model="geneEntered" label="Gene" prepend-icon="search">
          </v-text-field>
          <typeahead v-model="selectedGene"
          force-select v-bind:limit="typeaheadLimit" match-start
          target="#search-gene-name" :data="geneModel.allKnownGenes"
          item-key="gene_name"/>
        </span>




        <genes-menu
         ref="genesMenuRef"
         v-if="!isEduMode && !isBasicMode"
         :buttonIcon="`edit`"
         :geneModel="geneModel"
         :isBasicMode="isBasicMode"
         :isEduMode="isEduMode"
         @apply-genes="onApplyGenes"
         @clear-all-genes="onClearAllGenes">
        </genes-menu>

        <div v-if="!isEduMode && !isBasicMode && !launchedFromClin" id="search-or" style="display:inline-block">
          or
        </div>


        <phenotype-search
         v-if="!isEduMode && !launchedFromClin"
         style="margin-left:5px;margin-right:60px"
         :classAttention="clazzAttention"
         :isNav="true"
         :phenotypeLabel="isBasicMode ? 'Disorder' : 'Phenotype'"
         :defaultTopGenes="10"
         :geneModel="geneModel"
         @on-search-genes="onSearchPhenolyzerGenes"
         @on-start-search-genes="onStartSearchPhenolyzerGenes"
         @show-snackbar="onShowSnackbar"
         @hide-snackbar="onHideSnackbar">
        </phenotype-search>




<!--
        <v-btn v-if="!isEduMode && !isBasicMode" id="show-variants-button" flat  @click="onVariants">
         <v-icon>bookmark</v-icon>
         Variants
        </v-btn>
-->



      </v-toolbar-items>


      <files-menu
       v-if="!isEduMode && !isBasicMode"
       :cohortModel="cohortModel"
       @on-files-loaded="onFilesLoaded"
       @load-demo-data="onLoadDemoData"
      >
      </files-menu>

      <v-menu
      offset-y
      :close-on-content-click="false"
      :nudge-width="isBasicMode ? 300 : 350"
      v-model="showLegendMenu"
      >
        <v-btn flat slot="activator">
          Legend
        </v-btn>

        <legend-panel
        :isBasicMode="isBasicMode"
        style="max-width:400px">
        </legend-panel>
      </v-menu>


      <v-menu offset-y>
        <v-btn id="help-menu-button" flat slot="activator">Help</v-btn>
        <v-list>

          <v-list-tile  @click="onShowDisclaimer">
            <v-list-tile-title>Disclaimer</v-list-tile-title>
          </v-list-tile>
          <v-list-tile  @click="onShowVersion">
            <v-list-tile-title>About</v-list-tile-title>
          </v-list-tile>
          <v-list-tile  @click="onShowCitations">
            <v-list-tile-title>Software and resources</v-list-tile-title>
          </v-list-tile>

          <v-divider></v-divider>

          <v-list-tile id="load-demo-data-menu-item"  @click="onLoadDemoData">
            <v-list-tile-title>Load demo data</v-list-tile-title>
          </v-list-tile>

          <v-divider></v-divider>

          <v-list-tile  @click="onClearCache">
            <v-list-tile-title>Clear session data</v-list-tile-title>
          </v-list-tile>

          <v-divider></v-divider>

          <v-list-tile  @click="onWelcome">
            <v-list-tile-title>Show welcome page</v-list-tile-title>
          </v-list-tile>

          <v-list-tile @click="onShowBlog">
            <v-list-tile-title>Blog</v-list-tile-title>
          </v-list-tile>

          <v-list-tile @click="onShowTutorial" >
            <v-list-tile-title>Tutorials</v-list-tile-title>
          </v-list-tile>

          <v-list-tile @click="onShowIOBIO" >
            <v-list-tile-title>iobio</v-list-tile-title>
          </v-list-tile>

          <v-list-tile @click="onSupportIOBIO" >
            <v-list-tile-title>Support the iobio project</v-list-tile-title>
          </v-list-tile>



        </v-list>
      </v-menu>
    </v-toolbar>
    <v-navigation-drawer
      mobile-break-point="800"
      clipped
      fixed
      app
      :hide-overlay="true"
      v-model="leftDrawer"
      :stateless="true"
      width=330
    >
      <div id="side-panel-container">

        <flagged-variants-card
         v-if="leftDrawerContents == 'flagged-variants'"
         ref="flaggedVariantsRef"
         :isEduMode="isEduMode"
         :isBasicMode="isBasicMode"
         :cohortModel="cohortModel"
         :flaggedVariants="flaggedVariants"
         :launchedFromClin="launchedFromClin"
         @flagged-variants-imported="onFlaggedVariantsImported"
         @flagged-variant-selected="onFlaggedVariantSelected"
         @close-left-drawer="leftDrawer = false"
         @send-flagged-variants-to-clin="onSendFlaggedVariantsToClin"
        >
        </flagged-variants-card>



        <v-card id="legend-card" v-if="isBasicMode" >
          <legend-panel :isBasicMode="isBasicMode">
          </legend-panel>
        </v-card>




      </div>

    </v-navigation-drawer>

    <v-dialog v-model="showDisclaimer" max-width="400">
        <v-card>
          <v-card-title class="headline">Disclaimer</v-card-title>
          <v-card-text>

                  The University of Utah makes no claims that iobio applications, including gene.iobio are approved for clinical use. All users of iobio applications including gene.iobio understand and accept that any information gained by using these applications, whether the information comes from visualization, processing, internal or external databases, or analysis, may not in any way be used for clinical purposes. The University of Utah makes no representation that iobio or gene.iobio is either safe or effective for any intended use for which research may currently be performed.
                  <br><br>
                  iobio, or any iobio applications ARE TO BE USED FOR RESEARCH PURPOSES ONLY. USE FOR CLINICAL PURPOSES IS EXPRESSLY FORBIDDEN. Approval of iobio applications for clinical use has neither been applied for, nor received, in any country, including the United States of America.
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn raised  @click.native="showDisclaimer = false">Close</v-btn>
          </v-card-actions>
        </v-card>
    </v-dialog>


    <v-dialog v-model="showVersion" max-width="580">
        <v-card>
          <v-card-title class="headline">gene.iobio {{ globalApp.version }}</v-card-title>
          <v-card-text>


            <div  style="margin-top:4px;padding-top:0px;padding-bottom:0px;font-size:12px;color:rgb(132,132,132)">
              <div id="versions" >
                <div><span class="version-label">Human Genome Reference</span><span class="number">GRCh37, GRCh38</span></div>
                <div><span class="version-label">Gencode Human Reference</span><span class="number">19, 25</span></div>
                <div><span class="version-label">REFSEQ Human Reference</span><span class="number">ref_GRCh37.p5, ref_GRCh38.p7</span></div>
                <div><span class="version-label">Human Phenotype Ontology</span><span class="number">Build #102 (12-15-2015)</span></div>
                <div><div class="version-label">Phenolyzer</div><div class="number">1.0.5 (02-21-2015)</div></div>
                <div><div class="version-label">Variant Effect Predictor</div><div class="number">Version 92</div></div>
                <div><div class="version-label">&nbsp;&nbsp;&nbsp;SIFT</div><div class="number">5.2.2</div></div>
                <div><div class="version-label">&nbsp;&nbsp;&nbsp;PolyPhen</div><div class="number">2.2.2</div></div>
                <div><div class="version-label">FreeBayes</div><div class="number">v1.0.2-33-gdbb6160-dirty</div></div>
                <div><div class="version-label">Samtools</div><div class="number">samtools 1.3.1-33-gb25695b-dirty</div></div>
                <div><div class="version-label">vt subset, normalize</div><div class="number">0.577</div></div>
                <div><div class="version-label">gnomAD</div><div class="number">version 2.0.2 (October 3, 2017)</div></div>
                <div><div class="version-label">ExAC</div><div class="number">Release 0.3.1 (03-13-2016)</div></div>
                <div><div class="version-label">1000G</div><div class="number">Phase 3 (05-02-2013)</div></div>
                <div><div class="version-label">ACMG Genes</div> <div class="number">v2.0</div></div>


              </div>
            </div>

          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn raised  @click.native="showVersion = false">Close</v-btn>
          </v-card-actions>
        </v-card>
    </v-dialog>


   <v-dialog v-model="showCitations" max-width="700">
        <v-card>
          <v-card-title class="headline">Software and Resources</v-card-title>
          <v-card-text>


            <div id="credits">



              <div class="citation-title">Human Phenotype Ontology</div>
              Sebastian Köhler, Sandra C Doelken, Christopher J. Mungall, Sebastian Bauer, Helen V. Firth, et al.The Human Phenotype Ontology project: linking molecular biology and disease through phenotype data
              <a href="http://nar.oxfordjournals.org/content/42/D1/D966.full" target="_new">Nucliec Acids Res. (1 January 2014) 42 (D1): D966-D974 doi:10.1093/nar/gkt1026</a>


              <div class="citation-title">Phenolyzer</div>
              Yang, Hui, Peter N. Robinson, and Kai Wang. Phenolyzer: phenotype-based prioritization of candidate genes for human diseases.
              <a href="http://www.nature.com/nmeth/journal/v12/n9/abs/nmeth.3484.html" target="_new">Nature Methods (2015).
              </a>

              <div class="citation-title">SnpEff</div>
               "A program for annotating and predicting the effects of single nucleotide polymorphisms, SnpEff: SNPs in the genome of Drosophila melanogaster strain w1118; iso-2; iso-3.", Cingolani P, Platts A, Wang le L, Coon M, Nguyen T, Wang L, Land SJ, Lu X, Ruden DM. Fly (Austin). <a href="http://snpeff.sourceforge.net/SnpEff_paper.pdf" target="_new">2012 Apr-Jun;6(2):80-92.</a> PMID: 22728672 [PubMed - in process]

              <div class="citation-title">Variant Effect Predictor</div>
              McLaren W, Pritchard B, Rios D, Chen Y, Flicek P, Cunningham F.Deriving the consequences of genomic variants with the Ensembl API and SNP Effect Predictor.
              <a href="http://dx.doi.org/10.1093/bioinformatics/btq330" target="_new">Bioinformatics 26(16):2069-70(2010)doi:10.1093/bioinformatics/btq330</a>

              <div class="citation-title">PolyPhen</div>
              Adzhubei IA, Schmidt S, Peshkin L, Ramensky VE, Gerasimova A, Bork P, Kondrashov AS, Sunyaev SR. Nat Methods <strong>7</strong>(4):248-249 (2010). <a href="http://www.ncbi.nlm.nih.gov/pubmed/20354512" class="urlextern" title="http://www.ncbi.nlm.nih.gov/pubmed/20354512" rel="nofollow">PubMed</a> <a href="/pph2/dokuwiki/_media/nmeth0410-248.pdf" class="media mediafile mf_pdf" title="nmeth0410-248.pdf">PDF</a> <a href="/pph2/dokuwiki/_media/nmeth0410-248-s1.pdf" class="media mediafile mf_pdf" title="nmeth0410-248-s1.pdf">Supplemental Information</a>

              <div class="citation-title">SIFT</div>
                       Kumar P, Henikoff S, Ng PC. Predicting the effects of coding non-synonymous variants on
                       protein function using the SIFT algorithm.
                       <i>Nat Protoc. 2009</i>;4(7):1073-81.
               <a href="http://www.ncbi.nlm.nih.gov/pubmed/19561590">PubMed</a> <a href="/www/nprot.2009.86.pdf" target="_blank">PDF</a>

              <div class="citation-title">FreeBayes</div>
              Garrison E, Marth G. Haplotype-based variant detection from short-read sequencing
              <a href="/abs/1207.3907v2">arXiv:1207.3907v2</a> [q-bio.GN]

              <div class="citation-title">ClinVar</div>
              Landrum MJ, Lee JM, Riley GR, Jang W, Rubinstein WS, Church DM, Maglott DR. <u>ClinVar: public archive of relationships among sequence variation and human phenotype</u>. Nucleic Acids Res. 2014 Jan 1;42(1):D980-5. doi: 10.1093/nar/gkt1113. PubMed PMID: <a href="/pubmed/24234437">24234437</a>

              <div class="citation-title">Samtools</div>
              Li H.*, Handsaker B.*, Wysoker A., Fennell T., Ruan J., Homer N.,
              Marth G., Abecasis G., Durbin R. and 1000 Genome Project Data
              Processing Subgroup (2009) The Sequence alignment/map (SAM) format and
              SAMtools. Bioinformatics, 25,
              2078-9. [PMID: <a href="http://www.ncbi.nlm.nih.gov/pubmed/19505943">19505943</a>]

              <div class="citation-title">Bamtools</div>
              BamTools: a C++ API and toolkit for analyzing and managing BAM files</span>. Bioinformatics 2011;27:1691-1692.
              <a href="/cgi/ijlink?linkType=ABST&amp;journalCode=bioinfo&amp;resid=27/12/1691" class="cit-ref-sprinkles cit-ref-sprinkles-ijlinks"><span class="cit-reflinks-abstract">Abstract</span><span class="cit-sep cit-reflinks-variant-name-sep">/</span><span class="cit-reflinks-full-text"><span class="free-full-text">FREE </span>Full Text</span></a>

              <div class="citation-title">vt</div>
              <a rel="nofollow" class="external text" href="http://bioinformatics.oxfordjournals.org/content/31/13/2202">Adrian Tan, Gonçalo R. Abecasis and Hyun Min Kang. Unified Representation of Genetic Variants. Bioinformatics (2015) 31(13): 2202-2204</a>

              <div class="citation-title">ExAC</div>
              Analysis of protein-coding genetic variation in 60,706 humans<a href="http://biorxiv.org/content/early/2015/10/30/030338">preprint on bioRxiv</a>

              <br>
                      The authors would like to thank the Exome Aggregation Consortium and the groups that provided exome variant data for comparison. A full list of contributing groups can be found at
                      <a href="/about">http://exac.broadinstitute.org/about</a>.

              <div class="citation-title">1000 Genomes</div>
              Pilot Analysis
              <br>
                <a href="http://www.nature.com/nature/journal/v467/n7319/full/nature09534.html">A map of human genome variation from population-scale sequencing</a>
                <em>Nature 467, 1061–1073 (28 October 2010)</em>
                <br>Phase 1 Analysis<br>
                    <a href="http://www.nature.com/nature/journal/v491/n7422/full/nature11632.html">An integrated map of genetic variation from 1,092 human genomes</a>
                    <em>Nature 491, 56–65 (01 November 2012)</em>
                <br>Phase 3 Analysis <br>
                    <a href="http://www.nature.com/nature/journal/v526/n7571/full/nature15393.html">A global reference for human genetic variation</a>
                    <em>Nature 526, 68–74 (01 October 2015)</em>
                <br>
                    <a href="http://www.nature.com/nature/journal/v526/n7571/full/nature15394.html">An integrated map of structural variation in 2,504 human genomes</a>
                    <em>Nature 526, 75–81 (01 October 2015)</em>




            </div>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn raised  @click.native="showCitations = false">Close</v-btn>
          </v-card-actions>
        </v-card>
    </v-dialog>

  </div>
</template>

<script>

import { Typeahead }       from 'uiv'
import GenesMenu           from '../partials/GenesMenu.vue'
import FilesMenu           from '../partials/FilesMenu.vue'
import LegendPanel         from '../partials/LegendPanel.vue'
import FlaggedVariantsCard from '../viz/FlaggedVariantsCard.vue'
import PhenotypeSearch     from '../partials/PhenotypeSearch.vue'

export default {
  name: 'navigation',
  components: {
    Typeahead,
    GenesMenu,
    FilesMenu,
    FlaggedVariantsCard,
    LegendPanel,
    PhenotypeSearch
  },
  props: {
    isEduMode: null,
    isBasicMode: null,
    forMyGene2: null,
    geneModel: null,
    cohortModel: null,
    flaggedVariants: null,
    launchedFromClin: null,
    bringAttention: null
  },
  data () {
    let self = this;
    return {
      title: 'gene.iobio',

      selectedGene: {},
      geneEntered: null,
      clipped: false,
      leftDrawer: self.forMyGene2 ? true : false,
      rightDrawer: false,

      leftDrawerContents: "flagged-variants",
      showLegendMenu: false,
      showDisclaimer: false,
      showVersion: false,
      showCitations: false,
      typeaheadLimit: parseInt(100)

    }
  },
  watch: {
    selectedGene: function(a, b) {
      if (this.selectedGene) {
        this.geneEntered = this.selectedGene.gene_name;
        this.$emit("input", this.selectedGene.gene_name);
      }
    },
    leftDrawer: function() {
      this.$emit("on-left-drawer", this.leftDrawer);
    }
  },
  methods: {
    onLoadDemoData: function(loadAction) {
      this.$emit("load-demo-data", loadAction);
    },
    onClearCache: function() {
      this.$emit("clear-cache")
    },
    onClearAllGenes: function() {
      this.$emit("clear-all-genes");
    },
    onApplyGenes: function(genesToApply) {
      this.$emit("apply-genes", genesToApply, {replace: true, warnOnDup: true, isFromClin: false});
    },
    onSearchPhenolyzerGenes: function(searchTerm) {
      let self = this;
      let genesToApply = null;
      if (searchTerm) {
        var geneCount = self.geneModel.phenolyzerGenes.filter(function(gene) {
          return gene.selected;
        }).length;
        genesToApply = self.geneModel.phenolyzerGenes
        .filter(function(gene) {
          return gene.selected;
        })
        .map( function(gene) {
          return gene.geneName;
        })
        .join(", ");
        this.$emit("apply-genes", genesToApply, {phenotypes: searchTerm, replace: true});
      }
    },
    onStartSearchPhenolyzerGenes: function() {
      this.$emit("on-start-search-genes");
    },
    onVariants: function() {
      this.leftDrawerContents = "flagged-variants";
      this.leftDrawer = true;
    },
    onShowFlaggedVariants: function() {
      this.leftDrawerContents = "flagged-variants";
      this.leftDrawer = true;
    },
    onFlaggedVariantSelected: function(variant) {
      this.$emit("flagged-variant-selected", variant)
    },
    onFlaggedVariantsImported: function() {
      this.$emit("flagged-variants-imported")
    },
    onFilesLoaded: function(analyzeAll) {
      this.$emit("on-files-loaded", analyzeAll);
    },
    onWelcome: function() {
      this.$emit("on-show-welcome");
    },
    onShowDisclaimer: function() {
      this.showDisclaimer = true;
    },
    onShowVersion: function() {
      this.showVersion = true;
    },
    onShowCitations: function() {
      this.showCitations = true;
    },
    onSendFlaggedVariantsToClin: function(flaggedVariants) {
      this.$emit('send-flagged-variants-to-clin', flaggedVariants)
    },
    onShowSnackbar: function(snackbar) {
      this.$emit('show-snackbar', snackbar)
    },
    onHideSnackbar: function() {
      this.$emit('hide-snackbar')
    },
    onShowBlog: function() {
      window.open("http://iobio.io/tags/gene.iobio/", "_iobio");
    },
    onShowTutorial: function() {
      window.open("#/tutorial", "_tutorial");
    },
    onShowIOBIO: function() {
      window.open("http://iobio.io", "_iobio");
    },
    onSupportIOBIO: function() {
      window.open("http://iobio.io/support.html", "_iobio");
    }
  },
  created: function() {
  },
  mounted: function() {
     $("#search-gene-name").attr('autocomplete', 'off');

  },
  computed:  {
    clazzAttention: function() {
      if (this.bringAttention && this.bringAttention == 'gene' && this.selectedGene && Object.keys(this.selectedGene).length == 0) {
        return 'attention';
      } else {
        return '';
      }
    }
  }
}

</script>