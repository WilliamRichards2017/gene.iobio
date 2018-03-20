import jQuery               from 'jquery'
global.jQuery = jQuery
global.$ = jQuery

import globalEduTour        from './partials/GlobalEduTour.js'

import d3                   from 'd3'
import _                    from 'lodash'

import Vue                  from 'vue'
import VueRouter            from 'vue-router'

import App                  from './App.vue'
import Home                 from './components/pages/Home.vue'
import Exhibit              from './components/pages/Exhibit.vue'
import ExhibitCases         from './components/pages/ExhibitCases.vue'
import ExhibitCaseComplete  from './components/pages/ExhibitCaseComplete.vue'
import ExhibitCasesComplete from './components/pages/ExhibitCaseComplete.vue'


import bootstrap            from 'bootstrap/dist/css/bootstrap.css'
import { Typeahead }        from 'uiv'
Vue.use(Typeahead)

import Vuetify              from 'vuetify'
import                           'vuetify/dist/vuetify.css'
import                           '../assets/css/siteVuetify.css'
Vue.use(Vuetify)

import Util                 from './globals/Util.js'
import GlobalApp            from './globals/GlobalApp.js'

Vue.use(VueRouter);

const routes = [
  {
    name: 'home',
    path: '/',
    component: Home,
    props: (route) => ({
        paramGene:             route.query.gene,
        paramGenes:            route.query.genes,
        paramSpecies:          route.query.species,
        paramBuild:            route.query.build,
        paramBatchSize:        route.query.batchSize,
        paramGeneSource:       route.query.geneSource,
        paramMyGene2:          route.query.mygene2,
        paramMode:             route.query.mode,
        paramTour:             route.query.tour,
        paramFileId:           route.query.fileId,
        paramAffectedSibs:     route.query.affectedSibs,
        paramUnaffectedSibs:   route.query.unaffectedSibs,
        paramRelationships:    [route.query.rel0, route.query.rel1, route.query.rel2],
        paramSamples:          [route.query.sample0, route.query.sample1, route.query.sample2],
        paramNames:            [route.query.name0, route.query.name1, route.query.name2],
        paramBams:             [route.query.bam0, route.query.bam1, route.query.bam2],
        paramBais:             [route.query.bai0, route.query.bai1, route.query.bai2],
        paramVcfs:             [route.query.vcf0, route.query.vcf1, route.query.vcf2],
        paramTbis:             [route.query.tbi0, route.query.tbi1, route.query.tbi2],
        paramAffectedStatuses: [route.query.affectedStatus0, route.query.affectedStatus1, route.query.affectedStatus2]
    })
  },
  {
    name: 'exhibit',
    path: '/exhibit',
    component: Exhibit
  },
  {
    name: 'exhibit-cases',
    path: '/exhibit-cases',
    component: ExhibitCases
  },
  {
    name: 'exhibit-case-complete',
    path: '/exhibit-case-complete',
    component: ExhibitCaseComplete
  },
  {
    name: 'exhibit-cases-complete',
    path: '/exhibit-cases-complete',
    component: ExhibitCasesComplete
  }
]

const router = new VueRouter({
  //'mode':  'history',
  'routes': routes
})

// define a globals mixin object
Vue.mixin({
  data: function() {
    return {
      utility: new Util(),
      globalApp: new GlobalApp()
    };
  },
  created: function(){
    this.globalApp.utility = this.utility;
  }
})



window.vm = new Vue({
  el: '#app',
  created: function() {
  },
  render: h => h(App),
  router
})
