/* global window, document, Ember */
/**
 * A small, easy-to-use client-side localization module
 *
 * @constructor
 * @author Evan Rowe <er@evan-rowe.com>
 */
function Localize() {

  // Private
  var
    /**
     * The current locale. Can be changed during setup.
     *
     * @memberof LocalizeClass
     * @private
     * @type {string}
     */
    currentLocale = 'en-US',
    /**
     * The default context or module to use for fetching content. Optional.
     *
     * @memberof LocalizeClass
     * @private
     * @type {string}
     */
    defaultContext = '',
    /**
     * The default locale; used as a fallback. This should not be changed.
     *
     * @memberof LocalizeClass
     * @private
     * @type {string}
     */
    defaultLocale = 'en-US',
    /**
     * The default base path for the endpoint/static files which will deliver the content.
     *
     * @memberof LocalizeClass
     * @private
     * @type {string}
     */
    defaultPath = 'js/content',
    /**
     * The dictionary of localized text
     *
     * @memberof LocalizeClass
     * @private
     * @type {object}
     */
    dictionary = {};

  // Public
  /**
   * Get the defaultContext property
   *
   * @memberof LocalizeClass
   * @instance
   * @returns {string}
   */
  this.getDefaultContext = function() {

    return defaultContext;
  };
  /**
   * Get the defaultLocale property
   *
   * @memberof LocalizeClass
   * @instance
   * @returns {string}
   */
  this.getDefaultLocale = function() {

    return defaultLocale;
  };
  /**
   * Get the defaultPath property
   *
   * @memberof LocalizeClass
   * @instance
   * @returns {string}
   */
  this.getDefaultPath = function() {

    return defaultPath;
  };
  /**
   * Get the locale property
   *
   * @memberof LocalizeClass
   * @instance
   * @returns {string}
   */
  this.getCurrentLocale = function() {

    return currentLocale;
  };
  /**
   * Get the localization dictionary
   *
   * @memberof LocalizeClass
   * @instance
   * @param {string} [context] Optional, allows user to retrieve a specific context
   * @return {object}
   */
  this.getDict = function(context) {

    if (context) {

      return dictionary[currentLocale][context];

    } else {

      return dictionary[currentLocale];
    }
  };
  /**
   * Allows setting of the default path during setup
   *
   * @memberof LocalizeClass
   * @instance
   * @param {string} path The new base endpoint path to use
   */
  this.setDefaultPath = function(path) {

    defaultPath = path;
  };
  /**
   * Allows setting of the current locale
   *
   * @memberof LocalizeClass
   * @instance
   * @param {string} newLocale The two-letter code of the new locale to use
   */
  this.setCurrentLocale = function(newLocale) {

    currentLocale = newLocale;
  };
  /**
   * Allows setting the default context for fetching content modules
   *
   * @memberof LocalizeClass
   * @instance
   * @param {string} newContext The context to set as default
   */
  this.setDefaultContext = function(newContext) {

    defaultContext = newContext;
  };
  /**
   * Allows setting of the current dictionary
   *
   * @memberof LocalizeClass
   * @instance
   * @param {object} content The content to set on the dictionary
   * @param {string} dictContext The context to use for setting content. Defaults to the default context.
   */
  this.setDict = function(content, dictContext) {

    if ( content ) {

      if ( !dictContext ) {

        dictContext = defaultContext;
      }

      // If the current locale han't been set up in the dictionary, create it
      if (dictionary[currentLocale] === undefined) {

        dictionary[currentLocale] = {};
      }

      // If this particular context hasn't been created in the dictionary, create it
      if (dictionary[currentLocale][dictContext] === undefined) {

        dictionary[currentLocale][dictContext] = {};
      }

      // Iterate over each property in the content to ensure we are setting them
      // individually instead of overwriting the whole object
      for ( var prop in content ) {

        dictionary[currentLocale][dictContext][prop] = content[prop];
      }

    } else {

      if ( window.console && console.error ) {

        console.error('[Localize.setDict] : Unable to set dictionary; missing required content');
      }
    }
  };
}

/**
 * Setup Localize defaults
 *
 * @memberof Localize
 * @instance
 * @param {object} options A hash of properties and values to override default options:
 * @param {string} options.basePath If you wish to override the default base endpoint path, do so here
 * @param {string} options.currentLocale Override the default setting for the current locale
 * @param {boolean} options.log Whether or not to log any errors
 */
Localize.prototype.setupLocalize = function(options) {

  try {

    var registerHelper = null;

    // Override defaults
    if (options) {

      // Check to see if a locale has been specified
      if ( options.currentLocale && typeof options.currentLocale === "string" && options.currentLocale.length === 2 ) {

        this.setCurrentLocale(options.currentLocale);
      }

      // Check to see if a basePath has been specified
      if ( options.basePath && typeof options.basePath  === "string" ) {

        this.setDefaultPath(options.basePath);
      }

      if ( options.defaultContext ) {

        this.setDefaultContext(options.defaultContext);
      }
    }

    // FOR IE8: Add "indexOf" method to Array prototype
    if (!Array.prototype.indexOf) {

      Array.prototype.indexOf = function(elt, from) {

        var len = this.length >>> 0;
        from = Number(arguments[1]) || 0;

        from = (from < 0) ? Math.ceil(from) : Math.floor(from);

        if (from < 0) {

          from += len;
        }

        for ( ; from < len; from++ ) {

          if (from in this && this[from] === elt) {

            return from;
          }
        }

        return -1;
      };
    }

    // If an Ember app is present and is using Handlebars, register a helper for use in templates
    if ( window.Ember && window.Ember.Handlebars ) {

      // Account for Ember CLI helpers
      if ( Ember.Handlebars.registerBoundHelper ) {

        registerHelper = Ember.Handlebars.registerBoundHelper;

      } else {

        registerHelper = Ember.Handlebars.registerHelper;
      }

      registerHelper('localize', function(property, options){

        var params = options.hash,
            self = this;

        // Support variable interpolation for our string
        Object.keys(params).forEach(function(key){
          params[key] = Ember.Handlebars.get(self, params[key], options);
        });

        return Localize.fetch(property, params);
      });
    }

  } catch (ex) {

    if (options.log && window.console && console.error) {

      console.error(ex);
    }
  }
};

/**
 * Get localizated for the specified module using the current locale
 *
 * @memberof Localize
 * @instance
 * @param {object} options Configuration options for making the localization call
 * @param {string} options.context The namespace within the translation library to place the fetched key/value pairs
 * @param {string} options.fullPath If you need to construct a URL using something other than the default structure, set it here
 * @param {string} options.pathBase Relative path to locale files directory
 * @param {string} options.pathSuffix Alternative suffix to use for building the path (useful for URL query params)
 * @param {boolean} options.log Whether or not to log any errors
 */
Localize.prototype.getLocalizedData = function(options) {

  try {

    var currentLocale = this.getCurrentLocale(),
        data = null,
        localize = this,
        localizeContext = options.context || 'general',
        request = new window.XMLHttpRequest(),
        url = '',
        urlBase = '',
        urlSuffix = '';

    // If a full path has been specified, set the url of the ajax call here
    if (options.fullPath) {

      url = options.fullPath;

    } else {

      urlBase = options.pathBase || this.getDefaultPath();
      urlSuffix = options.pathSuffix || '.json';

      // construct the path to the locale content (endpoint or file)
      url = urlBase + urlSuffix;
      console.log(url);
    }

    request.open('GET', url, true);

    request.onreadystatechange = function() {

      if (this.readyState === 4) {

        if (this.status >= 200 && this.status < 400) {

          // Success!
          data = JSON.parse(this.responseText);
          localize.setDict(data, localizeContext);

          if (options.log && window.console && console.info) {

            console.info('[Localize.getLocalizedData] : Successfully fetched locale file for ' + currentLocale + ': ' + options.context);
          }
        } else {

          if (options.log && window.console && console.error) {

            console.error('[Localize.getLocalizedData] : Failed to fetch locale file for ' + currentLocale + ': ' + options.context);
            console.error(this.responseText);
          }
        }
      }
    };

    request.send();
    request = null;

    /*$.ajax(
      {
        async: false,
        context: localize,
        url: url,
        success: function(data) {

          self.setDict(data, localizeContext);

          if (options.log && window.console && console.info) {

            console.info('[Localize.getLocalizedData] : Successfully fetched locale file for ' + currentLocale + ': ' + options.context);

          }
        },
        error: function(xhr, status, error) {

          if (options.log && window.console && console.error) {

            console.error('[Localize.getLocalizedData] : Failed to fetch locale file for ' + currentLocale + ': ' + options.context);
            console.error(error);
          }

        }

      }
    );*/
  } catch (ex) {

    if (options.log && window.console && console.error) {

      console.error(ex);
    }
  }
};

/**
 * Fetch the localized text for a particular key.
 *
 * @memberof Localize
 * @instance
 * @param {string} key The key to fetch the localization for
 * @param {object} params Additional parameters (e.g. count=someObject.length)
 * @param {boolean} [log] Whether or not to log any errors
 */
Localize.prototype.fetch = function(key, params, log) {

  try {
    var i = 0,
        lookup = null,
        newKey = '',
        outputText = '',
        self = this;

    // Set defaults on args if less than all three have been supplied
    if ( arguments && arguments.length === 2 ) {

      if ( typeof params === 'boolean' ) {

        log = params,
        params = undefined;

      } else if ( typeof params === 'object') {

        log = false;
      }

    } else if ( arguments && arguments.length === 1 ) {

      log = false;
    }

    lookup = function(lookupKey) {

      var currentPath = '',
          splitPath = [];

      if (lookupKey) {

        splitPath = lookupKey.split('.');

        // Get the translation dictionary
        outputText = self.getDict();
        console.log(outputText);

        try {

          for (i=0; i < splitPath.length; i++ ) {

            currentPath = splitPath[i];

            if ( outputText[currentPath] === undefined || outputText[currentPath] === 'undefined' ) {

              outputText = '[missing translation for ' + self.getCurrentLocale() + '.' + lookupKey + ']';
              break;

            } else {

              outputText = outputText[currentPath];
            }
          }

        } catch (ex) {

          outputText = '[missing translation for ' + self.getCurrentLocale() + '.' + lookupKey + ']';

          if ( log && window.console && console.error ) {

            console.error(ex);
          }
        }
      }
    };

    if (key && typeof key === 'string') {

      lookup(key);

      if ( typeof outputText !== 'object' && outputText.indexOf('ref:') !== -1 ) {

        newKey = outputText.split('ref:')[1];
        lookup(newKey);
      }

      return outputText;

    } else {

      if (log && window.console && console.error) {

        console.error('[Localize.fetch] : The localization key is either missing or not a valid string');
      }

      outputText = '[missing translation for ' + self.getCurrentLocale() + '.' + key + ']';
      return outputText;
    }

  } catch (ex) {

    if (log && window.console && console.error) {

      console.error(ex);
    }
  }
};

/**
 * Designed to scan for HTML elements with a particular class
 * and replace them with localized content. Useful as a substitute
 * for UI applications that don't use a templating language
 * like Handlebars.
 *
 * @memberof LocalizeClass
 * @instance
 * @param {object} options Configuration options for this method
 * @param {string} options.replacementClassName The class name to search for when replacing elements. Defaults to 'localize-me'
 * @param {string} options.replacementModule The translation module to retrieve localized text from.
 * @param {boolean} [options.log] Whether or not to log any errors
 */
Localize.prototype.replaceAll = function(options) {

  try {

    var i = 0,
        currentNode = null,
        docFrag = {},
        els = [],
        localizeContext = '',
        localizeKey = '',
        outputNodes = [],
        replacementText = '',
        tempDiv = null;

    if ( options && !options.replacementClassName ) {

      options.replacementClassName = 'localize-me';
    }

    if ( options && !options.replacementModule ) {

      options.replacementModule = this.getDefaultContext();
    }

    if ( options && !options.log ) {

      options.log = false;
    }

    // Only define this if it doesn't exist yet
    if ( !document.getElementsByClassNameCustom ) {

      // Use a custom method for getting elements by class name.
      // Note: This is preferred to querySelectorAll as it is roughly 60% more performant: http://jsperf.com/getelementsbyclassname-vs-queryselectorall/18
      // Based on document.getElementsByClassName Polyfill adapted from Jonathan Snook: http://snook.ca/archives/javascript/your_favourite_1
      document.getElementsByClassNameCustom = function(testClassName) {

        var elements = document.getElementsByTagName('*'),
            i = 0,
            nodes = [],
            regEx = new RegExp('(^| )'+ testClassName +'( |$)');

        for ( i = 0; i < elements.length; i++ ) {

          if ( regEx.test(elements[i].className) ) {

            nodes.push(elements[i]);
          }
        }

        return nodes;
      };
    }

    // Get array of matching elements
    els = document.getElementsByClassNameCustom(options.replacementClassName);

    if ( els && els.length ) {

      for ( i = 0; i < els.length; i++ ) {

        // Set up a document fragment, get this node's localization key, its parent node, and the localized text from the key
        currentNode = els[i],
        tempDiv = document.createElement('div'),
        docFrag = document.createDocumentFragment(),
        localizeContext = currentNode.getAttribute('data-context') || this.getDefaultContext(),
        localizeKey = currentNode.getAttribute('data-key'),
        localizeKey = localizeContext + '.' + localizeKey,
        replacementText = this.fetch(localizeKey);

        // If the localized text we want doesn't exist, skip over this node and print a message to the console.
        // This ensures items with "special"/non-default contexts don't get erroneously replaced early.
        if ( replacementText && replacementText.indexOf('[missing') !== -1 ) {

          if (options.log && window.console && console.info) {

            console.info('[Localize.replaceAll] : Aborting replacement:' + replacementText);
          }

          continue;
        }

        if ( replacementText === undefined ) {

          replacementText = '[missing translation for ' + this.getCurrentLocale() + '.' + localizeKey + ']';
        }

        // This trick allows us to construct a series of HTML nodes from a plaintext string.
        tempDiv.innerHTML = replacementText,
        outputNodes = tempDiv.childNodes;

        // Fill the document fragment with either the text or HTML contained in the localized text.
        // This is a live collection of nodes, so we need to iterate based on array length.
        while (outputNodes.length > 0 ) {

          docFrag.appendChild(outputNodes[0]);
        }

        // Replace the original tag with the localized text or HTML
        currentNode.parentNode.replaceChild(docFrag, currentNode);
      }

    } else {

      if (options.log && window.console && console.info) {

        console.info('[Localize.replaceAll] : No replacment performed; no elements in the DOM were found for the class name ' + options.replacementClassName + '.');
      }
    }

  } catch (ex) {

    if (options.log && window.console && console.error) {

      console.error(ex);
    }
  }
};