
var googleAuth = (function () {

  function installClient() {
    var apiUrl = 'https://apis.google.com/js/api.js'
    return new Promise((resolve) => {
      var script = document.createElement('script')
      script.src = apiUrl
      script.onreadystatechange = script.onload = function () {
        if (!script.readyState || /loaded|complete/.test(script.readyState)) {
          setTimeout(function () {
            resolve()
          }, 500)
        }
      }
      document.getElementsByTagName('head')[0].appendChild(script)
    })
  }

  function initClient(config) {
    return new Promise((resolve, reject) => {
      console.log(config)
      window.gapi.load('auth2', () => {
        window.gapi.auth2.init(config)
          .then(() => {
            resolve(window.gapi)
          }).catch((error) => {
            reject(error)
          })
      })
    })

  }

  function Auth() {
    if (!(this instanceof Auth))
      return new Auth()
    this.GoogleAuth = null /* window.gapi.auth2.getAuthInstance() */
    this.isAuthorized = false
    this.isInit = false
    this.prompt = null
    this.ux_mode = 'redirect'
    this.isLoaded = function () {
      /* eslint-disable */
      console.warn('isLoaded() will be deprecated. You can use "this.$gAuth.isInit"')
      return !!this.GoogleAuth
    };

    this.load = (config, prompt, ux_mode) => {
      installClient()
        .then(() => {
          return initClient(config)
        })
        .then((gapi) => {
          this.GoogleAuth = gapi.auth2.getAuthInstance()
          this.isInit = true
          this.prompt = prompt
          this.ux_mode = ux_mode //'redirect'
          this.isAuthorized = this.GoogleAuth.isSignedIn.get()
        }).catch((error) => {
          console.error(error)
        })
    };

    this.signIn = (successCallback, errorCallback) => {
      return new Promise((resolve, reject) => {
        if (!this.GoogleAuth) {
          if (typeof errorCallback === 'function') errorCallback(false)
          reject(false)
          return
        }
        this.GoogleAuth.signIn({ux_mode: 'redirect', redirect_uri: ''})
          .then(googleUser => {
            if (typeof successCallback === 'function') successCallback(googleUser)
            this.isAuthorized = this.GoogleAuth.isSignedIn.get()
            resolve(googleUser)
          })
          .catch(error => {
            if (typeof errorCallback === 'function') errorCallback(error)
            reject(error)
          })
      })
    };

    this.getAuthCode = (successCallback, errorCallback) => {
      return new Promise((resolve, reject) => {
        if (!this.GoogleAuth) {
          if (typeof errorCallback === 'function') errorCallback(false)
          reject(false)
          return
        }
        this.GoogleAuth.grantOfflineAccess({ prompt: this.prompt, ux_mode: 'redirect' })
          .then(function (resp) {
            if (typeof successCallback === 'function') successCallback(resp.code)
            resolve(resp.code)
          })
          .catch(function (error) {
            if (typeof errorCallback === 'function') errorCallback(error)
            reject(error)
          })
      })
    };

    this.signOut = (successCallback, errorCallback) => {
      return new Promise((resolve, reject) => {
        if (!this.GoogleAuth) {
          if (typeof errorCallback === 'function') errorCallback(false)
          reject(false)
          return
        }
        this.GoogleAuth.signOut()
          .then(() => {
            if (typeof successCallback === 'function') successCallback()
            this.isAuthorized = false
            resolve(true)
          })
          .catch(error => {
            if (typeof errorCallback === 'function') errorCallback(error)
            reject(error)
          })
      })
    };

    this.setSigninStatus = (isSignedIn) => {
      var user = this.GoogleAuth.currentUser.get();
      var isAuthorized = user.hasGrantedScopes('profile email');
      if (isAuthorized) {
        return true;
      } else {
        return false
      }

    }
    this.isSignedIn_ = (successCallback, errorCallback) => {
      return new Promise((resolve, reject) => {
        if (!this.GoogleAuth) {
          if (typeof errorCallback === 'function') errorCallback(false)
          this.isAuthorized = false
          reject(false)
          return
        }
        if (typeof successCallback === 'function') successCallback()
        // let response = this.GoogleAuth.isSignedIn.listen(this.setSigninStatus())
        let response = this.GoogleAuth.isSignedIn.get()
        if(response) {
          var googleUser = this.GoogleAuth.currentUser.get()
          var isAuthorized = googleUser.hasGrantedScopes('profile email');
          resolve(googleUser)
        }
      })
    }
  }

  return new Auth()
})();




function installGoogleAuthPlugin(Vue, options) {
  /* eslint-disable */
  //set config
  let GoogleAuthConfig = null
  let GoogleAuthDefaultConfig = { scope: 'profile email', discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'], ux_mode: 'redirect' }
  let prompt = 'select_account'
  let ux_mode = 'redirect'
  let redirect_uri = ''
  if (typeof options === 'object') {
    GoogleAuthConfig = Object.assign(GoogleAuthDefaultConfig, options)
    if (options.scope) GoogleAuthConfig.scope = options.scope
    if (options.prompt) prompt = options.prompt
    if (options.ux_mode) ux_mode	= options.ux_mode
    if (options.redirect_uri) redirect_uri = options.redirect_uri
    if (!options.clientId) {
      console.warn('clientId is required')
    }
  } else {
    console.warn('invalid option type. Object type accepted only')
  }

  //Install Vue plugin
  Vue.gAuth = googleAuth
  Object.defineProperties(Vue.prototype, {
    $gAuth: {
      get: function () {
        return Vue.gAuth
      }
    }
  })
  Vue.gAuth.load(GoogleAuthConfig, prompt, ux_mode, redirect_uri)
}

export default installGoogleAuthPlugin
