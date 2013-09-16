var restAPI= function() {
	var api={};
	
	 api.BaseCollection=Backbone.Collection.extend({
		
		constructor: function() {
			var opts=arguments[1]||arguments[0];
			if (_.isObject(opts) && !_.isArray(opts)) {
				var additionalOpts=['query', 'page', 'pageSize', 'pageSizeParam'];
				_.each(additionalOpts, 
						function (item) {
							if (opts[item]) {
								this[item]=opts[item]
							}
						},
						this);
			};
			Backbone.Collection.apply(this, arguments);
		},
		
//		initialize: function() {
//			this.on('error', function(model, xhr, options) {
//				alert('Server Error on Collection: '+xhr.status + ' - '+xhr.statusText);
//			});
//		},
		
		url: function() {
			var qs=[];
			if (this.pageSizeParam) {
				var psParam={};
				psParam[this.pageSizeParam]=this.pageSize || this._defaultPageSize;
				qs.push(psParam);
			};
			if (this.page) {
				qs.push({page:this.page});
			}
			if (this.query) {
				qs.push(this.query);
			};
			qs=_.map(qs, $.param).join('&');
			
			if (qs.length>0) {
				return this.urlRoot + '?'+qs;
			}else {
			return this.urlRoot;
			}
		},
		_pageRe:/page=(\d+)/,
		_defaultPageSize:20,
		parse: function(response) {
		    
		    this.pages=Math.ceil(response.count/(this.pageSize||this._defaultPageSize));
		    this.nextPage=null;
		    this.previousPage=null;
		    if (response.next) {
		    this.nextPage=parseInt(this._pageRe.exec(response.next)[1])
		    };
		    if (response.previous) {
			    this.previousPage=parseInt(this._pageRe.exec(response.previous)[1])
			    };
		    return response.results;
		  },
		  
		  fetchNext: function(options) {
			  if (this.nextPage) {
				  this.page=this.nextPage;
				  this.fetch(options);
				  return true;
			  }
		  },
		  
		  fetchPrevious: function(options) {
			  if (this.previousPage) {
				  this.page=this.previousPage;
				  this.fetch(options);
				  return true;
			  }
		  }
		
	});

	api.BaseModel=Backbone.Model.extend({
		
		initialize: function() {
			this.on('error', function(model, xhr, options) {
				alert('Server Error on Model: '+xhr.status + ' - '+xhr.statusText);
			});
		},
		
		defaults: function() {
			var defs={}
			for (var name in this.fields) {
				if ( ! this.fields[name]['read_only']) {
				if (this.fields[name]['default'] ) {
					defs[name]=this.fields[name]['default'];
				} else {
					defs[name]=null;
				}}
			}
			return defs
		},
		
		validate: function(attrs) {
			
		},
		
		updateFromForm: function(rootElem) {
			if (!rootElem) {
				throw "rootElem is mandatory"
			};
			var $el=$(rootElem);
			
			var getVal=function(input) {
				if (input.attr('type')==="checkbox") {
					return input.prop('checked');
				}
				return input.val();
			};
			
			var dirty=false;
			var diff=function(old, newer) {
				
				var compareArrays= function(a1,a2) {
				    
				    if (!a1 || !a2)
				        return false;
				    if (a1.length !== a2.length)
				        return false;

				    for (var i = 0; i < a1.length; i++) {
				        if (_.isArray(a1[i]) && _.isArray(a2[i])) {
				            if ( !compareArrays(a1[i],a2[i]))
				                return false;
				        }
				        else if (a1[i] != a2[i]) {
				            return false;
				        }
				    }
				    return true;
				};
				
				return old && newer && !(old==newer  || _.isArray(old) && compareArrays(old, newer))
			};
			for (var key in this.attributes) {
				var readOnly=this.readOnly();
				if (readOnly.indexOf(key)>=0) {
					continue;
				}
				var input=$el.find('input[name="'+key+'"], select[name="'+key+'"]');
				if (input.length<1) {
					throw "Input for attribute " + key+ " is missing";
				}
				
				var newVal=getVal(input);
				if (diff(this.get(key), newVal)) {
				this.set(key, newVal);
				dirty=true;
				}
			}
			
			return dirty;
		},
		
		readOnly: function() {
			var ro=[];
			for (var name in this.fields) {
				if (this.fields[name].read_only) {
					ro.push(name)
				}
			};
			return ro;
		}
		
	});

	{{models}}
	return api
}();