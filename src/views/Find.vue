<template>
    <div>
      <h2>Find Reading Material</h2>
      <div v-for="(value, index) in configRemote" v-bind:key="index">
        {{ value.microcosm }}{{ value.pdffilepath }}
      </div>
      <form>
      <input
        type="text"
        v-model="microcosm"
        placeholder="microcosm"
        autocorrect="off"
        autocapitalize="none"
      />
      <input
        type="text"
        v-model="pdffilepath"
        placeholder="file path of pdf text file"
        autocorrect="off"
        autocapitalize="none"
      />
      </form>
      <button
        @click.prevent="
          findReading(microcosm, pdffilepath)
        "
      >
        Search
      </button>
    </div>
  </template>
  
  <script>
    import { mapState } from 'vuex'

    export default {
        name: 'Find',

        data: function () {
            return {
                microcosm: '',
                pdffilepath: ''
            }
        },
        computed: mapState({
            configRemote: (state) => state.configRemote,
        }),

        methods: {
            findReading(microcosm, pdffilepath){
                this.$store.dispatch('findReading', {
                    microcosm,
                    pdffilepath
                })
            },
        },
    }
  </script>
  
  <style lang="css" scoped>
  img {
    width: 50%;
  }
  </style>
  