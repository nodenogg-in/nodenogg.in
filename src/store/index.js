import Vue from 'vue'
import Vuex from 'vuex'
import PouchDB from 'pouchdb'

import uiStore from '@/experimental/uiStore'
import Router from '@/router'

Vue.use(Vuex)

var myclient = 'firstvisit'
var localxpos = 50
var localypos = 50

if (localStorage.getItem('mylastMicrocosm') == null) {
  var microcosm = 'firstvisit'
} else {
  microcosm = localStorage.getItem('mylastMicrocosm')
}

if (localStorage.getItem('myNNClient') == null) {
  myclient = 'firstvisit'
} else {
  myclient = localStorage.getItem('myNNClient')
}

var pouchdb = new PouchDB(microcosm)

var remote =
  process.env.VUE_APP_COUCH_HTTP +
  '://' +
  process.env.VUE_APP_COUCH_USER +
  ':' +
  process.env.VUE_APP_COUCH_PASS +
  process.env.VUE_APP_COUCH_URL +
  microcosm +
  '/'

//console.log(remote)
//var remotetwo = 'http://127.0.0.1:5984/'

// console.log(remote)
const store = new Vuex.Store({
  state: {
    shortcutstate: false,
    showtipsstate: true,
    //  connectionstate: false,
    version: process.env.VUE_APP_VERSION,
    localnodeid: '',
    global_pos_name: 'positions',
    global_con_name: 'connections',
    global_emoji_name: 'emojis',
    microcosm: '',
    myclient: myclient,
    activeNode: {},
    // this will be objects containing arrays of all the handles / connections and nodes
    configConnect: {},
    configHandle: {},
    allNodes: [],
    myNodes: [
      // { nodeid: 1, nodetext: 'node 1' },
    ],
    otherNodes: [
      //{}
    ],
    configPositions: [
      //{}
    ],
    configConnections: [
      //{}
    ],
    configEmoji: [
      //{}
    ],
    configRemote: [
      // {
      // protocol: 'https://',
      // couchusername: 'something',
      // couchpassword: 'passcouch',
      // couchurl: 'domain.com',
      // },
      // { https://,
      // couchusername
      // couchpassword
      // couchURL}
    ]
  },
  mutations: {
    CREATE_MICROCOSM(state, doc) {
      // const urldevice = Router.currentRoute.params.device
      const urlmicrocosm = Router.currentRoute.params.microcosm
      pouchdb.close().then(function () {
        if (urlmicrocosm != undefined) {
          // myclient = urldevice
          microcosm = urlmicrocosm
          localStorage.setItem('mylastMicrocosm', microcosm)
        } else {
          microcosm = doc
        }

        pouchdb = new PouchDB(microcosm)
        if (state.configRemote && state.configRemote.length > 0) {
          remote =
            state.configRemote[0].protocol +
            state.configRemote[0].couchusername +
            ':' +
            state.configRemote[0].couchpassword +
            '@' +
            state.configRemote[0].couchurl +
            '/' +
            microcosm +
            '/'
        } else {
          remote =
            process.env.VUE_APP_COUCH_HTTP +
            '://' +
            process.env.VUE_APP_COUCH_USER +
            ':' +
            process.env.VUE_APP_COUCH_PASS +
            process.env.VUE_APP_COUCH_URL +
            microcosm +
            '/'
        }

        store.dispatch('syncDB')
      })
    },

    GET_ALL_NODES(state) {
      pouchdb
        .allDocs({
          include_docs: true,
          attachments: true,
        })
        .then(function (doc) {
          state.microcosm = microcosm
          state.allNodes = doc.rows
          store.commit('SET_OTHER_NODES')
          store.commit('GET_MY_NODES')
        })
        .catch(function () {
          //     console.log(err)
        })
    },

    SET_OTHER_NODES(state) {
      state.otherNodes = []

      var i
      var j
      for (i = 0; i < Object.keys(state.allNodes).length; i++) {
        if (
          state.allNodes[i].id != state.myclient &&
          state.allNodes[i].id != state.global_pos_name &&
          state.allNodes[i].id != state.global_emoji_name &&
          state.allNodes[i].id != state.global_con_name //&&
          //
        ) {
          for (
            j = 0;
            j < Object.keys(state.allNodes[i].doc.nodes).length;
            j++
          ) {
            //  if (state.allNodes[i].doc.nodes[j].deleted != true) {
            const newNode = {
              node_id: state.allNodes[i].doc.nodes[j].node_id,
              node_text: state.allNodes[i].doc.nodes[j].node_text,
              deleted: state.allNodes[i].doc.nodes[j].deleted,
              color: state.allNodes[i].doc.nodes[j].color,
            }

            state.otherNodes.push(newNode)
          }
          // }
        }
      }
      //// console.log(state.otherNodes)
    },

    SET_CLIENT(state, doc) {
      state.myclient = doc
      store.commit('GET_MY_NODES')
    },

    GET_URL_MICROCOSM(state, doc) {
      state.microcosm = doc
      localStorage.setItem('mylastMicrocosm', doc)
      // store.commit('GET_MY_NODES')
    },

    GET_MY_NODES(state) {
      pouchdb
        .get(state.myclient)
        .then(function (doc) {
          var i
          for (i = 0; i < Object.keys(doc.nodes).length; i++) {
            // PREVIOUS: approach to removing nodes that are flagged as deleted before
            // if (doc.nodes[i].deleted == true) {
            //   //  doc.nodes.splice(i, 1)
            // }

            state.myNodes = doc.nodes
          }
        })
        .catch(function (err) {
          if (err.status == 404) {
            var startup =
              Math.random().toString(36).substring(2, 15) +
              Math.random().toString(36).substring(2, 15)

            return pouchdb.put({
              _id: state.myclient,
              _attachments: {},
              nodes: [
                {
                  // FIXME: these values are here as GET_ALL_NODES cant hunt a blank
                  // this shouldn't need to be here though
                  node_id: startup,
                  node_text: '',
                  node_owner: state.myclient,
                  content_type: 'sheet',
                  // NOTE: the first node is also hidden due to a position not being created
                  deleted: true,
                },
              ],
            })
          }
        })
    },

    GET_POSITIONS(state) {
      pouchdb
        .get(state.global_pos_name)
        .then(function (doc) {
          state.configPositions = doc.positions
        })
        .catch(function (err) {
          //    console.log(err)
          if (err.status == 404) {
            return pouchdb.put({
              _id: state.global_pos_name,
              positions: [],
            })
          }
        })
    },

    GET_CONNECTIONS(state) {
      pouchdb
        .get(state.global_con_name)
        .then(function (doc) {
          state.configConnections = doc.connections
        })
        .catch(function (err) {
          // console.log(err)
          if (err.status == 404) {
            return pouchdb.put({
              _id: state.global_con_name,
              connections: [],
            })
          }
        })
    },

    MAKE_CONNECT(state, e) {
      var connectid =
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15)

      state.configConnections.push({
        connect_id: connectid,
        start_id: e.fromnode,
        end_id: e.tonode,
        x_pos_start: e.xposstart,
        y_pos_start: e.yposstart,
        x_pos_end: e.xposend,
        y_pos_end: e.yposend,
      })

      pouchdb
        .get(state.global_con_name)
        .then(function (doc) {
          // put the store into pouchdb

          return pouchdb.bulkDocs([
            {
              _id: state.global_con_name,
              _rev: doc._rev,
              connections: state.configConnections,
            },
          ])
        })
        .then(function () {
          return pouchdb.get(state.global_con_name).then(function (doc) {
            state.configConnections = doc.connections
          })
        })
        .catch(function (err) {
          if (err.status == 404) {
            // pouchdb.put({  })
          }
        })
    },

    UPDATE_CONNECT(state, e) {
      // console.log(e)
      var i
      for (i = 0; i < Object.keys(state.configConnections).length; i++) {
        if (e.localnodeid == state.configConnections[i].start_id) {
          state.configConnections[i].x_pos_start = e.x
          state.configConnections[i].y_pos_start = e.y
        }
      }

      pouchdb
        .get(state.global_con_name)
        .then(function (doc) {
          //console.log(doc)
          // put the store into pouchdb
          return pouchdb.bulkDocs([
            {
              _id: state.global_con_name,
              _rev: doc._rev,
              connections: state.configConnections,
            },
          ])
        })
        .then(function () {
          return pouchdb.get(state.global_con_name).then(function (doc) {
            state.configConnections = doc.connections
          })
        })
        .catch(function (err) {
          if (err.status == 404) {
            // pouchdb.put({  })
          }
        })
    },

    UPDATE_CONNECT_TWO(state, e) {
      // console.log(e)
      var i
      for (i = 0; i < Object.keys(state.configConnections).length; i++) {
        if (e.localnodeid == state.configConnections[i].end_id) {
          state.configConnections[i].x_pos_end = e.x
          state.configConnections[i].y_pos_end = e.y
        }
      }

      pouchdb
        .get(state.global_con_name)
        .then(function (doc) {
          //console.log(doc)
          // put the store into pouchdb
          return pouchdb.bulkDocs([
            {
              _id: state.global_con_name,
              _rev: doc._rev,
              connections: state.configConnections,
            },
          ])
        })
        .then(function () {
          return pouchdb.get(state.global_con_name).then(function (doc) {
            state.configConnections = doc.connections
          })
        })
        .catch(function (err) {
          if (err.status == 404) {
            // pouchdb.put({  })
          }
        })
    },

    MOVE_POS(state, e) {
      //console.log(e)
      var i
      for (i = 0; i < Object.keys(state.configPositions).length; i++) {
        if (e.localnodeid == state.configPositions[i].node_id) {
          state.configPositions[i].x_pos = e.x
          state.configPositions[i].y_pos = e.y
          state.configPositions[i].width = e.width
          state.configPositions[i].height = e.height
          state.configPositions[i].z_index = e.zindex
        }
      }

      pouchdb
        .get(state.global_pos_name)
        .then(function (doc) {
          //  // console.log(doc)
          // put the store into pouchdb
          return pouchdb.bulkDocs([
            {
              _id: state.global_pos_name,
              _rev: doc._rev,
              positions: state.configPositions,
            },
          ])
        })
        .then(function () {
          return pouchdb.get(state.global_pos_name).then(function (doc) {
            state.configPositions = doc.positions
          })
        })
        .catch(function (err) {
          if (err.status == 404) {
            // pouchdb.put({  })
          }
        })
    },

    //

    SHORTCUT_STATE(state, e) {
      state.shortcutstate = e
    },

    SHOWTIPS_STATE(state, e) {
      state.showtipsstate = e
    },

    UPDATE_REMOTE(state, e) {
      state.configRemote = [
        {
          protocol: e.protocol,
          couchusername: e.couchusername,
          couchpassword: e.couchpassword,
          couchurl: e.couchurl,
        },
      ]
    },

    FIND_READING(state, e) {
        
      var microcosm_pouchdb = new PouchDB(e.microcosm)

        // get all the documents in this microcosm database
        microcosm_pouchdb.allDocs({
          include_docs: true,
          attachments: true,})
        .then(
          function (alldocs) {
            const ignorablenodes = ['connections', 'emojis', 'positions'];
            
            var allnodetext = '{ "nodes": \n ['
            var subsequentnode = false

            for (let i = 0; i < alldocs.total_rows; i++) { 
              var doc = alldocs.rows[i].doc
              // if the id isn't one of positions, emojis or connections then get the node text
              if (!ignorablenodes.includes(doc._id)){
                // for each node in this doc get the node text and add it to the json string
                if (subsequentnode){
                  allnodetext = allnodetext + ',\n'
                }
                for (let node in doc.nodes){
                  subsequentnode = true
                  // ignore first node of each remaining document
                  if (node != 0){
                    // made it a json string for now so it works with sleepr tool python scripts
                    var encoded_text = JSON.stringify(doc.nodes[node].node_text)
                    allnodetext = allnodetext + '  { "node_text": \n    ' + encoded_text + '\n  }'
                    
                    if (node != doc.nodes.length - 1){
                      var stringLength = allnodetext.length;
                      if (allnodetext.charAt(stringLength - 2) != ','){
                        allnodetext = allnodetext + ',\n'
                      }
                    }
                  }
                }

              }
            }
            // close up the json string
            allnodetext = allnodetext + "\n  ]\n}"

            // create and download the json file 
            var file = new Blob([allnodetext], {type: "application/json"});
            var a = document.createElement("a"),
            url = URL.createObjectURL(file);
            a.href = url;
            a.download = (microcosm + "_allnodetext");
            document.body.appendChild(a);
            a.click();
            setTimeout(function() {
              document.body.removeChild(a);
              window.URL.revokeObjectURL(url);  
            }, 0)

            // access flask server

            // send it the json text, the pdf file path

          })
      },

    ADD_NODE(state) {
      var i
      var zindex
      var totalNodes = []
      for (i = 0; i < Object.keys(state.allNodes).length; i++) {
        if (
          state.allNodes[i].id != state.global_pos_name &&
          state.allNodes[i].id != state.global_emoji_name &&
          state.allNodes[i].id != state.global_con_name //&&
          //
        ) {
          // console.log(state.allNodes[i].doc.nodes.length)
          totalNodes.push(state.allNodes[i].doc.nodes.length)
        }
      }
      const reducer = (accumulator, currentValue) => accumulator + currentValue
      if (totalNodes && totalNodes.length > 0) {
        zindex = totalNodes.reduce(reducer)
      } else {
        zindex = 1
      }

      var uniqueid =
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15)
      state.localnodeid = uniqueid
      if (state.microcosm == 'firstvisit') {
        // console.log('not allowed on this microcosm')
      } else {
        pouchdb.get(state.myclient).then(function (doc) {
          doc.nodes.push({
            node_id: uniqueid,
            node_text: '',
            node_owner: state.myclient,
            content_type: 'sheet',
            deleted: false,
            read_mode: false,
            color: '#9bc2d8',
          })

          return pouchdb
            .put({
              _id: state.myclient,
              _rev: doc._rev,
              _attachments: doc._attachments,
              nodes: doc.nodes,
            })
            .then(function () {
              return pouchdb.get(state.myclient).then(function (doc) {
                state.myNodes = doc.nodes
                var end = Object.keys(state.myNodes).length - 1
                const newNode = {
                  nodeid: state.myNodes[end].id,
                  nodetext: state.myNodes[end].text,
                  //  content_type: state.notes[end].content_type
                }
                state.activeNode = newNode
              })
            })
            .catch(function (err) {
              if (err.status == 404) {
                // pouchdb.put({  })
              }
            })
        })
        pouchdb.get(state.global_pos_name).then(function (doc) {
          //console.log(doc.positions[doc.positions.length - 1].z_index)
          var i
          localxpos = 50
          localypos = 50
          for (i = 0; i < Object.keys(doc.positions).length; i++) {
            if (doc.positions[i].x_pos == 50) {
              localxpos = 70
              localypos = 70
            }
            if (doc.positions[i].x_pos == 70) {
              localxpos = 90
              localypos = 90
            }
            if (doc.positions[i].x_pos == 90) {
              localxpos = 110
              localypos = 110
            }
            if (doc.positions[i].x_pos == 110) {
              localxpos = 50
              localypos = 50
            }
          }

          doc.positions.push({
            node_id: uniqueid,
            x_pos: localxpos,
            y_pos: localypos,
            width: 200,
            height: 370,
            z_index: zindex,
            read_mode: false,
            node_sort: 0,
          })
          return pouchdb
            .put({
              _id: state.global_pos_name,
              _rev: doc._rev,
              positions: doc.positions,
            })
            .catch(function () {
              // console.log(err)
            })
        })
      }
    },

    EDIT_NODE(state, e) {
      //   console.log(e)
      var i
      for (i = 0; i < Object.keys(state.myNodes).length; i++) {
        if (e.nodeid == state.myNodes[i].node_id) {
          state.myNodes[i].node_text = e.nodetext
        }
      }
      pouchdb
        .get(state.myclient)
        .then(function (doc) {
          // put the store into pouchdb

          return pouchdb.bulkDocs([
            {
              _id: state.myclient,
              _rev: doc._rev,
              _attachments: doc._attachments,
              nodes: state.myNodes,
            },
          ])
        })
        .then(function () {
          return pouchdb.get(state.myclient).then(function (doc) {
            state.myNodes = doc.nodes
          })
        })
        .catch(function (err) {
          if (err.status == 404) {
            // pouchdb.put({  })
          }
        })
    },

    COLOR_NODE(state, e) {
      //   console.log(e)
      var i
      for (i = 0; i < Object.keys(state.myNodes).length; i++) {
        if (e.nodeid == state.myNodes[i].node_id) {
          state.myNodes[i].color = e.color
        }
      }
      pouchdb
        .get(state.myclient)
        .then(function (doc) {
          // put the store into pouchdb

          return pouchdb.bulkDocs([
            {
              _id: state.myclient,
              _rev: doc._rev,
              _attachments: doc._attachments,
              nodes: state.myNodes,
            },
          ])
        })
        .then(function () {
          return pouchdb.get(state.myclient).then(function (doc) {
            state.myNodes = doc.nodes
          })
        })
        .catch(function (err) {
          if (err.status == 404) {
            // pouchdb.put({  })
          }
        })
    },

    DELETE_FLAG(state, e) {
      var i
      for (i = 0; i < Object.keys(state.myNodes).length; i++) {
        if (e.e == state.myNodes[i].node_id) {
          state.myNodes[i].deleted = true
        }
      }
      pouchdb
        .get(state.myclient)
        .then(function (doc) {
          // put the store into pouchdb
          return pouchdb.bulkDocs([
            {
              _id: state.myclient,
              _rev: doc._rev,
              _attachments: doc._attachments,
              nodes: state.myNodes,
            },
          ])
        })
        .then(function () {
          return pouchdb.get(state.myclient).then(function (doc) {
            state.myNodes = doc.nodes
          })
        })
        .catch(function (err) {
          if (err.status == 404) {
            // pouchdb.put({  })
          }
        })
    },

    RESTORE_NODE(state, e) {
      // console.log(e)
      var i
      for (i = 0; i < Object.keys(state.myNodes).length; i++) {
        if (e.e == state.myNodes[i].node_id) {
          state.myNodes[i].deleted = false
        }
      }
      pouchdb
        .get(state.myclient)
        .then(function (doc) {
          // put the store into pouchdb
          return pouchdb.bulkDocs([
            {
              _id: state.myclient,
              _rev: doc._rev,
              _attachments: doc._attachments,
              nodes: state.myNodes,
            },
          ])
        })
        .then(function () {
          return pouchdb.get(state.myclient).then(function (doc) {
            state.myNodes = doc.nodes
          })
        })
        .catch(function (err) {
          if (err.status == 404) {
            // pouchdb.put({  })
          }
        })
    },

    READ_FLAG(state, e) {
      var i
      for (i = 0; i < Object.keys(state.myNodes).length; i++) {
        if (e.e == state.myNodes[i].node_id) {
          state.myNodes[i].read_mode = e.readmode
        }
      }
      pouchdb
        .get(state.myclient)
        .then(function (doc) {
          // put the store into pouchdb
          return pouchdb.bulkDocs([
            {
              _id: state.myclient,
              _rev: doc._rev,
              _attachments: doc._attachments,
              nodes: state.myNodes,
            },
          ])
        })
        .then(function () {
          return pouchdb.get(state.myclient).then(function (doc) {
            state.myNodes = doc.nodes
          })
        })
        .catch(function (err) {
          if (err.status == 404) {
            // pouchdb.put({  })
          }
        })
    },

    SORT_NODE(state, e) {
      var i
      for (i = 0; i < Object.keys(state.configPositions).length; i++) {
        if (e.nodeid == state.configPositions[i].node_id) {
          state.configPositions[i].node_sort = e.nodesort
        }
      }
      pouchdb
        .get(state.global_pos_name)
        .then(function (doc) {
          //  // console.log(doc)
          // put the store into pouchdb
          return pouchdb.bulkDocs([
            {
              _id: state.global_pos_name,
              _rev: doc._rev,
              positions: state.configPositions,
            },
          ])
        })
        .then(function () {
          return pouchdb.get(state.global_pos_name).then(function (doc) {
            state.configPositions = doc.positions
          })
        })
        .catch(function (err) {
          if (err.status == 404) {
            // pouchdb.put({  })
          }
        })
    },

    LEGACY_READ_FLAG(state, e) {
      var i
      // console.log(e.e)
      for (i = 0; i < Object.keys(state.configPositions).length; i++) {
        if (e.e == state.configPositions[i].node_id) {
          state.configPositions[i].read_mode = e.readmode
        }
      }

      pouchdb
        .get(state.global_pos_name)
        .then(function (doc) {
          //  // console.log(doc)
          // put the store into pouchdb
          return pouchdb.bulkDocs([
            {
              _id: state.global_pos_name,
              _rev: doc._rev,
              positions: state.configPositions,
            },
          ])
        })
        .then(function () {
          return pouchdb.get(state.global_pos_name).then(function (doc) {
            state.configPositions = doc.positions
          })
        })
        .catch(function (err) {
          if (err.status == 404) {
            // pouchdb.put({  })
          }
        })
    },

    GET_EMOJI(state) {
      // console.log
      pouchdb
        .get(state.global_emoji_name)
        .then(function (doc) {
          state.configEmoji = doc.emojis
        })
        .catch(function (err) {
          // console.log(err)
          if (err.status == 404) {
            // console.log('ok')
            return pouchdb.put({
              _id: state.global_emoji_name,
              emojis: [],
            })
          }
        })
    },
    ADD_EMOJI(state, e) {
      var uniqueid =
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15)
      pouchdb.get(state.global_emoji_name).then(function (doc) {
        doc.emojis.push({
          emoji_id: uniqueid,
          node_id: e.nodeid,
          emoji_text: e.emojitext,
        })
        return pouchdb
          .put({
            _id: state.global_emoji_name,
            _rev: doc._rev,
            emojis: doc.emojis,
          })
          .catch(function () {
            // console.log(err)
          })
      })
    },
  },

  actions: {
    getURLParam: () => {
      const urlparam = Router.currentRoute.params.microcosm
      // // console.log(urlparam)
      store.commit('GET_URL_MICROCOSM', urlparam)
    },

    syncDB: () => {
      pouchdb.replicate.from(remote).on('complete', function () {
        store.commit('GET_ALL_NODES')
        //  store.commit('GET_MY_NODES')
        store.commit('GET_POSITIONS')
        store.commit('GET_CONNECTIONS')
        store.commit('GET_EMOJI')
        // turn on two-way, continuous, retriable sync
        pouchdb
          .sync(remote, {
            live: true,
            since: 'now',
            retry: true,
            attachments: true,
          })
          .on('change', function () {
            // pop info into function to find out more
            store.commit('GET_ALL_NODES')
            //   store.commit('GET_MY_NODES')

            store.commit('GET_POSITIONS')
            store.commit('GET_CONNECTIONS')
            store.commit('GET_EMOJI')
          })
          .on('paused', function () {
            // replication paused (e.g. replication up to date, user went offline)
            // // console.log('replication paused')
          })
          .on('active', function () {
            // replicate resumed (e.g. new changes replicating, user went back online)
            //// console.log('back active')
          })
          .on('denied', function () {
            // a document failed to replicate (e.g. due to permissions)
          })
          .on('complete', function () {
            // handle complete
          })
          .on('error', function () {
            // console.log(err)
          })
      })
    },
    createMicrocosm: ({ commit }, e) => {
      commit('CREATE_MICROCOSM', e)
    },
    setClient: ({ commit }, e) => {
      commit('SET_CLIENT', e)
    },

    movePos: ({ commit }, nodeid, xpos, ypos, width, height, zindex) => {
      commit('MOVE_POS', nodeid, xpos, ypos, width, height, zindex)
    },

    sortNode: ({ commit }, e) => {
      commit('SORT_NODE', e)
    },
    updateConnect: ({ commit }, fromnode, xposstart, yposstart) => {
      commit('UPDATE_CONNECT', fromnode, xposstart, yposstart)
    },
    updateConnectTwo: ({ commit }, tonode, xposend, yposend) => {
      commit('UPDATE_CONNECT_TWO', tonode, xposend, yposend)
    },

    legacyreadFlag: ({ commit }, e) => {
      // var text = e.target.value
      commit('LEGACY_READ_FLAG', e)
    },

    readFlag: ({ commit }, e) => {
      // var text = e.target.value
      commit('READ_FLAG', e)
    },
    addNode: ({ commit }, e) => {
      commit('ADD_NODE', e)
    },
    editNode: ({ commit }, { nodeid, nodetext }) => {
      commit('EDIT_NODE', { nodeid, nodetext })
    },

    colorNode: ({ commit }, { nodeid, color }) => {
      commit('COLOR_NODE', { nodeid, color })
    },

    updateRemote: (
      { commit },
      { protocol, couchusername, couchpassword, couchurl }
    ) => {
      commit('UPDATE_REMOTE', {
        protocol,
        couchusername,
        couchpassword,
        couchurl,
      })
    },
    findReading: (
      { commit },
      { microcosm, pdffilepath }
    ) => {
      commit('FIND_READING', {
        microcosm,
        pdffilepath
      })
    },

    makeConnect: (
      { commit },
      { fromnode, tonode, xposstart, yposstart, yposend, xposend }
    ) => {
      commit('MAKE_CONNECT', {
        fromnode,
        tonode,
        xposstart,
        yposstart,
        yposend,
        xposend,
      })
    },
    shortcutState: ({ commit }, e) => {
      commit('SHORTCUT_STATE', e)
    },

    showTipsstate: ({ commit }, e) => {
      commit('SHOWTIPS_STATE', e)
    },

    // connectionState: ({ commit }, e) => {
    //   commit('CONNECTION_STATE', e)
    // },
    deleteFlag: ({ commit }, e) => {
      // var text = e.target.value
      commit('DELETE_FLAG', e)
    },

    restoreNode: ({ commit }, e) => {
      // var text = e.target.value
      commit('RESTORE_NODE', e)
    },

    addEmoji: ({ commit }, { nodeid, emojitext }) => {
      commit('ADD_EMOJI', {
        nodeid,
        emojitext,
      })
    },
  },
  modules: {
    ui: uiStore,
  },
})

export default store
store.dispatch('syncDB')
