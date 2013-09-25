/*
combined files : 

gallery/trees/1.0/store
gallery/trees/1.0/base
gallery/trees/1.0/tree
gallery/trees/1.0/viewstore
gallery/trees/1.0/view
gallery/trees/1.0/list
gallery/trees/1.0/select
gallery/trees/1.0/city
gallery/trees/1.0/index

*/
/** 
* Store 树专用数据缓冲对象
* @version 2.0
*/
KISSY.add('gallery/trees/1.0/store',function(S){

	/**
	* Store 树专用数据缓冲对象 树的遍历、树的数据管理
	* @class Trees.Store
	* @module Trees
	* @author 桐人<wwwfuzheng@qq.com>
	* @extend KISSY.Base
	* @constructor Store
	* @param {Object} config 配置项
	*/
	function Store(config){
		var _self = this;
		config = S.merge(Store.config, config);
		Store.superclass.constructor.call(_self, config);
		//支持的事件
		_self.events = [
			/**  
			* 数据加载完成时 触发此事件（load/setTreeData 都会触发)
			* @event load
			* @param {event} e  事件对象
			* @param {Array} e.data 加载的数据
			* @param {String} e.id 所在节点的id
			* @param {Object} e.param 加载的参数（setTreeData触发时没有此属性）
			*/
			'load',
			/**  
			* 通过text遍历搜索树后 触发此事件
			* @event searchTree
			* @param {event} e  事件对象
			* @param {String} e.text 搜索的文本值
			* @param {Array} e.pathList 搜索的路径id集合
			* @param {Array} e.valuePathList 搜索的路径value集合
			* @param {Object} e.result 搜索结果
			*/
			'searchTree'
		];
		_self._init();
	}
	Store.config = {
		/**
		* 数据异步读取url（选填，不填的话可以手动设置树的数据）
		* @property url
		* @type String
		*/
		url: null,
		/**
		* 异步请求方式('get'/'post')，在jsonp方式下，不起作用，固定为get
		* @property requestType
		* @type String
		* @default  'get'
		*/
		requestType: 'get',
		/**
		* 节点数据中，id的key（选填, 不填的话默认是 adapterForNode.id）
		* @property idKey
		* @type String
		*/
		idKey: null,
		/**
		* 数据读取的初始化参数，与 url 配合适用（选填）
		* @property param
		* @type Object
		* @default  {}
		*/
		param: {},
		/**
		* 给store初始化用的数据
		* @property data
		* @type Array
		* @default  []
		*/
		data: [],
		/**
		* 是否用jsonp形式发送请求
		* @property isJsonp
		* @type Boolean
		* @default  false
		*/
		isJsonp: false,
		/**
		* 数据是否自动加载（选填）
		* @property autoLoad
		* @type Boolean
		* @default  true
		*/
		autoLoad: true,
		/**
		* node数据的适配器（选填）
		* @property adapterForNode
		* @type Object
		* @default  
		*	{
		*		id: 'id',
		*		value: 'value',
		*		children: 'children',
		*		parent: 'parent',
		*		isleaf: 'isleaf'
		*	}
		*/
		adapterForNode: {
			id: 'id',
			value: 'value',
			children: 'children',
			parent: 'parent',
			isleaf: 'isleaf'
		},
		/**
		* 数据的适配器（选填）
		* @property adapterForData
		* @type Object
		* @default  
		*	{
		*		success: 'success',
		*		nodes: 'nodes',
		*		message: 'message'
		*	}
		*/
		adapterForData: {
			success: 'success',
			nodes: 'nodes',
			message: 'message'
		},
		/**
		* 当数据加载失败的回调方法（选填）
		* @property dataErrorFunc
		* @type Function
		* @default  alert(msg);
		*/
		dataErrorFunc: function(msg){
			//S.error(msg);
		}
	};
	S.extend(Store, S.Base);

	S.augment(Store, {
		/**
		* 检查树的数据是否加载完成
		* @method isTreeReady
		* @param {Object} [node] 要检查的节点对象 （选填，不填则检查整个树对象）
		* @param {Function} [func] 若没有完成时，加载数据是需要回调的方法 （选填）
		* @return {Boolean} 是否准备完成
		*/
		isTreeReady: function(node, func){
			var _self = this,
				adapterForNode = _self.get('adapterForNode'),
				nodeData,
				isReady = true;
			
			if(node){
				if(node[adapterForNode.isleaf]){
					return true;
				}else{
					nodeData = node[adapterForNode.children];
				}
			}else{
				nodeData = _self.getTreeData();
			}

			if(nodeData.length === 0){
				isReady = false;
			}
			// 若没有准备好，则加载数据
			if(!isReady){
				var id = node ? node[adapterForNode.id] : null;
				_self.load(id, null, func);
			}

			return isReady;
		},
		/**
		* 加载树数据 此方法会触发load事件
		* @method load
		* @param {Object|String} [param] 参数对象 或 需要加载的id (不填则取默认的参数对象，若是String，则会用idKey配置参数对象)
		* @param {String} [url] 加载数据的url （选填，没有则取默认的url）
		* @param {Function} [func] 加载完成时需要回调的方法 （选填）
		* @param {Boolean} [isTreeData] 是否加载整树数据 （选填，默认为false）
		*/
		load: function(param, url, func, isTreeData){
			var _self = this,
				adapterForData = _self.get('adapterForData'),
				idKey = _self.get('idKey'),
				isTreeData = isTreeData || false,
				loadParam = _self._getParam(param),
				ajaxConfig = {
					type: _self.get('requestType'),
					dataType: 'json'
				};

			url = url || _self.get('url');
			// 若调用load 则 url 必填
			if(!url){
				throw 'please assign the URL of Data for Tree!';
			}
			// 是否用jsonp方式请求
			if(_self.get('isJsonp')){
				ajaxConfig = S.merge(ajaxConfig, {
					type: 'get',
					dataType: 'jsonp',
					cache: false,
					crossDomain: true
				});
			}

			S.io(S.merge(ajaxConfig, {
				url: url,
				data: loadParam,
				success: function(data){
					if(data && data[adapterForData.success] === true  && data[adapterForData.nodes].length > 0){
						_self.fire('load', {
							data: data[adapterForData.nodes],
							id: isTreeData ? null : loadParam[idKey] || null, 
							param: loadParam
						});
						if(func){
							func();
						}
					}else{
						_self._dataError(data ? data[adapterForData.message] : '');
					}
				},
				error: function(){
					_self._dataError('请求异常！');
				}				
			
			}));
		},
		/**
		* 初始化加载store
		* @method initLoad
		*/
		initLoad: function(){
			var _self = this;
			if(_self.get('url')){
				_self.load();
			}else{
				_self.setTreeData(_self.get('data'));
			}
		},
		/**
		* 遍历树，通过id搜索节点
		* @method traverseTreeById
		* @param {String|Number} id 目标id。 若没有，则返回的皆为空值
		* @return {Object} 返回值： 
				obj.path => 该节点的路径id
				obj.valuePath => 该节点的路经value
				obj.pathNode => 该节点的路经node
				obj.node => 该节点对象
		*/
		traverseTreeById: function(id){
			var _self = this,
				adapterForNode = _self.get('adapterForNode'),
				treeData = _self.getTreeData(),
				path = [],
				valuePath = [],
				pathNode = [],
				_traverse;

			_traverse = function(nodeData, deep){
				deep = deep || 0;
				if(nodeData){
					for(var i = 0; i < nodeData.length; i++){
						var node = nodeData[i];
						if(node[adapterForNode.id] === id || (!node[adapterForNode.isleaf] && _traverse(node[adapterForNode.children], deep + 1))){
							path[deep] = node[adapterForNode.id];
							valuePath[deep] = node[adapterForNode.value];
							pathNode[deep] = node;
							return true;
						}
					}
				}
				return false;			
			};

			if(id){
				_traverse(treeData);
			}

			return {
				path: path,
				valuePath: valuePath,
				pathNode: pathNode,
				node: pathNode[pathNode.length - 1] || null
			};
		},
		/**
		* 遍历树，通过text搜索节点列表
		* @method traverseTreeByText
		* @param {String} text 目标文本。 若没有，则返回的皆为空值
		* @return {Object} 返回值： 
				obj.pathList => 路径id列表
				obj.valuePathList => 路径value列表
				obj.pathNodeList => 路径node列表，节点数据不带children属性
		*/
		traverseTreeByText: function(text){
			var _self = this,
				adapterForNode = _self.get('adapterForNode'),
				treeData = _self.getTreeData(),
				path = [],
				pathNode = [],
				valuePath = [],
				pathList = [],
				pathNodeList = [],
				valuePathList = [],
				_traverse;

			_traverse = function(nodeData, deep){
				deep = deep || 0;
				if(nodeData){
					for(var i = 0; i < nodeData.length; i++){
						var l = path.length - deep - 1,
							node = nodeData[i];
						for(var j = 0; j < l; j++){
							path.pop();
							valuePath.pop();
							pathNode.pop();
						}
						path[deep] = node[adapterForNode.id];
						valuePath[deep] = node[adapterForNode.value];
						pathNode[deep] = node;
						if(node[adapterForNode.value].indexOf(text) > -1){
							pathList.push(S.clone(path));
							valuePathList.push(S.clone(valuePath));
							pathNodeList.push(_self.dataFilter(pathNode));
						}
						if(!node[adapterForNode.isleaf]){
							_traverse(node[adapterForNode.children], deep + 1);
						}
					}
				}
			};

			if(text){
				_traverse(treeData);
			}

			return {
				pathList: pathList,
				pathNodeList: pathNodeList,
				valuePathList: valuePathList
			};
		},
		/**
		* 通过id 获取节点对象
		* @method getNodeById
		* @param {String|Number} id 目标id。 若没有，则返回空值
		* @return {Object} 节点对象
		*/
		getNodeById: function(id){
			var _self = this;
			return _self.traverseTreeById(id).node;
		},
		/**
		* 通过Path 获取节点对象
		* @method getNodeByPath
		* @param {Array} path 目标path。 若没有，则返回空值
		* @return {Object} 节点对象
		*/
		getNodeByPath: function(path){
			path = path || [];
			var _self = this,
				adapterForNode = _self.get('adapterForNode'),
				treeData = _self.getTreeData(),
				node = null,
				nodeChildren = treeData;
			S.each(path, function(id){
				S.each(nodeChildren, function(n){
					if(n[adapterForNode.id] === id){
						node = n;
						return false;
					}
				});
				nodeChildren = node[adapterForNode.children];
			});

			return node;
		},
		/**
		* 通过id 获取节点路径
		* @method getPathById
		* @param {String|Number} id 目标id。 若没有，则返回[]
		* @return {Array} 节点路径
		*/
		getPathById: function(id){
			var _self = this;
			return _self.traverseTreeById(id).path;
		},
		/**
		* 通过id 获取该节点的父节点对象
		* @method getParentById
		* @param {String|Number} id 目标id。 （必填）
		* @return {Object} 父节点对象
		*/
		getParentById: function(id){
			var _self = this,
				adapterForNode = _self.get('adapterForNode'),
				node = _self.getNodeById(id),
				parentId = node[adapterForNode.parent];
			return _self.getNodeById(parent);
		},
		/**
		* 通过id 获取子节点列表
		* @method getChildrenById
		* @param {String|Number} id 目标id。 若没有，则返回[]
		* @return {Array} 子节点列表
		*/
		getChildrenById: function(id){
			var _self = this,
				adapterForNode = _self.get('adapterForNode'),
				node = _self.getNodeById(id);
			return node ? node[adapterForNode.children] || [] : [];
		},
		/**
		* 通过Path 获取子节点列表
		* @method getChildrenByPath
		* @param {Array} path 目标path。 若没有，则返回 treeData
		* @return {Array} 子节点列表
		*/
		getChildrenByPath: function(path){
			path = path || [];
			var _self = this,
				adapterForNode = _self.get('adapterForNode'),
				node = null;
			if(path.length === 0){
				return _self.getTreeData();
			}else{
				node = _self.getNodeByPath(path);
				return node ? node[adapterForNode.children] || [] : [];
			}
		},
		/**
		* 获取节点的子节点列表
		* @method getChildrenByNode
		* @param {Object} node 目标节点
		* @return {Array} 子节点列表
		*/
		getChildrenByNode: function(node){
			var _self = this,
				adapterForNode = _self.get('adapterForNode'),
				children = [];
			if(node){
				children = node[adapterForNode.children] || [];			
			}else{
				children = [];
			}
			return children;
		},
		/**
		* 根据id 获取节点的全部叶子节点
		* @method getLeafsById
		* @param {String} id 目标节点Id
		* @return {Array} 叶子节点路径列表（pathNade）, 路径内不带当前节点，节点数据不带children属性
		*/
		getLeafsById: function(id){
			var _self = this,
				adapterForNode = _self.get('adapterForNode'),
				node = _self.getNodeById(id);
			return node ? _self.getLeafsByNode(node) : [];
		},
		/**
		* 根据节点 获取节点的全部叶子节点
		* @method getLeafsByNode
		* @param {Object} node 目标节点
		* @return {Array} 叶子节点路径列表（pathNade）, 路径内不带当前节点，节点数据不带children属性
		*/
		getLeafsByNode: function(node){
			var _self = this,
				adapterForNode = _self.get('adapterForNode'),
				_traverse,
				pathNode = [],
				leafsList = [];
					
			_traverse = function(nodeData, deep){
				deep = deep || 0;
				if(nodeData){
					for(var i = 0; i < nodeData.length; i++){
						var l = pathNode.length - deep - 1,
							node = nodeData[i];
						for(var j = 0; j < l; j++){
							pathNode.pop();
						}
						pathNode[deep] = node;
						if(node[adapterForNode.isleaf]){
							leafsList.push(_self.dataFilter(pathNode));
						}else{
							_traverse(node[adapterForNode.children], deep + 1);
						}
					}
				}
			};
			
			_traverse(_self.getChildrenByNode(node));
			
			return leafsList;
		},
		/**
		* 获取树的数据
		* @method getTreeData
		* @return {Array} 树数据
		*/
		getTreeData: function(){
			var _self = this;
			return _self.get('treeData');
		},
		/**
		* 手动填充树的数据 此方法会触发load事件
		* @method setTreeData
		* @param {Array} nodeData 带填充的节点列表
		* @param {String|Number} [id] 需要填充的节点id, (选填，若不填则当作整个树数据填充)
		*/
		setTreeData: function(nodeData, id){
			var _self = this;
			_self.fire('load', {data: nodeData, id: id});
		},
		/**
		* 通过文本搜索树 此方法会触发searchTree事件
		* @method searchTree
		* @param {String} searchText 要搜索的文本
		* @return {Object} 搜索结果
		*/
		searchTree: function(searchText){
			var _self = this,
				searchResult = _self.traverseTreeByText(searchText);

			_self.fire('searchTree', {
				text: searchText,
				pathList: searchResult.pathList,
				valuePathList: searchResult.valuePathList,
				result: searchResult
			});

			return searchResult;
		},
		/**
		* 将节点中的children属性过滤掉
		* @method dataFilter
		* @param {Array|Object} data 需要过滤的数据: 节点 或节点列表
		* @return {Array|Object} 过滤后的数据
		*/
		dataFilter: function(data){
			var _self = this,
				adapterForNode = _self.get('adapterForNode'),
				_data,
				_filter = function(n){
					return S.clone(n, function(v, k){
						if(k === adapterForNode.children){
							return false;
						}
					});
				};
				
			if(S.isArray(data)){
				_data = [];
				S.each(data, function(n){
					var filterData = _filter(n);
					_data.push(filterData);			
				});
			}else{
				_data = _filter(data);
			}

			return _data;
		},
		/**
		* 获取特定层级的树
		* @method getTreeByLevel
		* @param {Number} level 目标层级 跟节点为0级
		* @return {Array} 过滤后获取的数据
		*/
		getTreeByLevel: function(level){
			var _self = this,
				treeData = _self.getTreeData(),
				adapterForNode = _self.get('adapterForNode'),
				data = S.clone(treeData),
				_traverse;
			
			_traverse = function(nodeData, deep){
				deep = deep || 0;
				if(nodeData){
					for(var i = 0; i < nodeData.length; i++){
						var node = nodeData[i];
						if(deep === level - 1){
							node[adapterForNode.children] = [];
							node[adapterForNode.isleaf] = true;
						}else{
							_traverse(node[adapterForNode.children], deep + 1);
						}
					}
				}
			};
			
			if(level > 0){
				_traverse(data);
			}else{
				data = [];
			}

			return data;		
		},

		/**
		* 对象销毁
		* @method destroy
		*/
		destroy: function(){
			var _self = this;
			_self.detach();
			_self = null;
		},
		// 初始化
		_init: function(){
			var _self = this;
			_self.set('treeData', []);

			_self._initIdKey();

			_self._initEvent();

			if(_self.get('autoLoad')){
				_self.initLoad();
			}

		},
		// 初始化事件
		_initEvent: function(){		
			var _self = this;
			// 当load后把数据填充进treeData
			_self.on('load', function(e){
				_self._fillInTreeData(e.data, e.id);
			});
		},
		// 初始化idKey
		_initIdKey: function(){
			var _self = this,
				adapterForNode = _self.get('adapterForNode'),
				idKey = _self.get('idKey');
			if(!idKey){
				_self.set('idKey', adapterForNode.id);
			}
		},
		// 填充数据到treeData 若无id则作为整个树填充
		_fillInTreeData: function(data, id){
			var _self = this,
				adapterForNode = _self.get('adapterForNode'),
				nodeChildren = _self.getTreeData(),
				node;
			if(id){
				node = _self.getNodeById(id);
				if(node){
					nodeChildren = node[adapterForNode.children];
				}
			}
			nodeChildren.length = 0;
			S.each(data, function(n){
				nodeChildren.push(n);
			});
		},
		// 载入数据出错时调用
		_dataError: function(msg){
			var _self = this;
			if(msg){
				_self.get('dataErrorFunc')(msg);
			}
		},
		// 获取重载参数
		_getParam: function(param){
			var _self = this,
				idKey = _self.get('idKey'),
				lastParam = _self.get('lastParam') || _self.get('param'),
				loadParam = {};

			if(!!param && (S.isNumber(param) || S.isString(param))){
				// 若 param是id 则用idKey 配置参数对象
				loadParam[idKey] = param;
				loadParam = S.merge(lastParam, loadParam);
			}else if(!param || S.isEmptyObject(param)){
				// 取上一次参数或默认参数
				loadParam = lastParam;
			}else if(S.isPlainObject(param)){
				loadParam = param;
			}
			
			_self.set('lastParam', loadParam);
			return loadParam;		
		}

	});

	return Store; 

},{requires: ['core']});



/**
* Tree.Base 树的基类
* @version 2.0
* @date: 2013-05-3
*/
KISSY.add('gallery/trees/1.0/base',function(S, Store, XTemplate){
	var DOM = S.DOM,
		Event = S.Event;

	/**
	* Base 树的基类 负责数据对象管理、结果管理、回显管理
	* @class Trees.Base
	* @module Trees
	* @author 桐人<wwwfuzheng@qq.com>
	* @extend KISSY.Base
	* @constructor Base
	* @param {Object} config 配置项
	*/
	function Base(config){
		var _self = this;
		config = S.merge(Base.config, config);
		if(!config.renderTo || !DOM.get('#' + config.renderTo)){
			throw 'please assign the id of render Dom!';
		}
		Base.superclass.constructor.call(_self, config);
		//支持的事件
		_self.events = [
			/**
			* 代理Store的load事件 树的数据加载完成后 触发此事件
			* @event load
			* @param {event} e 事件对象
			* @param {String} e.data 加载的数据
			* @param {Array} e.id 父节点id
			* @param {Array} e.param 加载参数
			*/
			'load',
			/**
			* 代理Store的searchTree事件 通过text遍历搜索树后 触发此事件
			* @event searchTree
			* @param {event} e 事件对象
			* @param {String} e.text 搜索的文本值
			* @param {Array} e.pathList 搜索的路径id集合
			* @param {Array} e.valuePathList 搜索的路径value集合
			* @param {Object} e.result 搜索结果
			*/
			'searchTree',
			/**
			* 增加堆栈结果集时触发该事件
			* @event resultPush
			* @param {event} e 事件对象
			* @param {Object} e.resultObj 新增的结果对象
			* @param {Array} e.result 当前结果集
			*/
			'resultPush',
			/**
			* 减少堆栈结果集时触发该事件
			* @event resultPop
			* @param {event} e 事件对象
			* @param {Object} e.resultObj 减少的结果对象
			* @param {Array} e.result 当前结果集
			*/
			'resultPop',
			/**
			* 结果集更新是时触发该事件 pop和push都会触发
			* @event resultUpdate
			* @param {event} e 事件对象
			* @param {Array} e.result 当前结果集
			*/
			'resultUpdate',
			/**
			* 在销毁对象前 触发此事件
			* @event beforeDestroy
			*/
			'beforeDestroy',
			/**
			* tree载入，在数据load结束后，数据初始化之前触发
			* @event loadTree
			* @param {event} e 事件对象
			*/
			'loadTree',
			/**
			* 数据初始化，在数据load结束后，并且tree载入完成时触发
			* @event initData
			* @param {event} e 事件对象
			* @param {Array} e.id 需要初始化的节点id或id列表
			*/
			'initData',
			/**
			* 重新载入树数据，在载入之前触发
			* @event beforeReload
			* @param {event} e 事件对象
			*/
			'beforeReload',
			/**
			* 树全部加载完成后触发
			* @event loadFinished
			* @param {event} e 事件对象
			*/
			'loadFinished'
		];
		_self._init();
	}
	Base.config = {
		/**
		* 树渲染dom的容器ID (必填)
		* @property renderTo
		* @type String
		*/
		renderTo: null,
		/**
		* 存储选择结果的容器Id（选填, 没有则不写入结果，此处写入的是选择节点的id）
		* @property resultId
		* @type String
		*/
		resultId: null,
		/**
		* 获取结果的类型 可选填的值有：'result', 'id', 'value', 'path', 'valuePath', 'valueStr' 可以组合多个类型的值 用空格隔开 注意：只有'result', 'id', 'path'三种类型支持回显
		* @property resultType
		* @type String
		* @default 'result'
		*/
		resultType: 'result',
		/**
		* 传入store对象
		* @property store
		* @type Object
		*/
		store: null,
		/**
		* 这里是 storeConfig.url 的简写形式，用于数据异步读取url（选填，不填的话可以手动设置树的数据）
		* @property url
		* @type String
		*/
		url: null,
		/**
		* 这里是 storeConfig.idKey 的简写形式，用于标识节点数据中，id的key（选填, 不填的话默认是 adapterForNode.id）
		* @property idKey
		* @type String
		*/
		idKey: null,
		/**
		* 这里是 storeConfig.param 的简写形式，用于数据读取的初始化参数，与 url 配合适用（选填）
		* @property param
		* @type Object
		* @default {}
		*/
		param: {},
		/**
		* 这里是 storeConfig.data 的简写形式，用于数据读取的初始化数据（选填）
		* @property data
		* @type Array
		* @default []
		*/
		data: [],
		/**
		* 这里是 storeConfig.isJsonp 的简写形式，用于选择是否用jsonp形式发送请求
		* @property isJsonp
		* @type Boolean
		* @default  false
		*/
		isJsonp: false,
		/**
		* 在这里进行store的配置，具体配置项请参见treeSore（选填）
		* @property storeConfig
		* @type Object
		*/
		storeConfig: {},
		/**
		* 节点文案显示模板(kissy.XTemplate)，默认只显示value
		* @property contentTemplate
		* @type String
		* @default  null
		*/
		contentTemplate: null
	};

	S.extend(Base, S.Base);
	S.augment(Base, {
		/**
		* 调用store的load方法，载入tree的数据
		* @method storeLoad
		* @param {Object|String|Array} [param] 参数对象 或 需要加载的id (不填则取默认的参数对象，若是String，则会用idKey配置参数对象) 或想置的数据
		*/
		storeLoad: function(param, isTreeData){
			var _self = this,
				store = _self.getStore();
			if(param){
				if(S.isArray(param)){
					store.setTreeData(param);
				}else{
					store.load(param, null, null, isTreeData);
				}
			}else{
				store.initLoad();
			}
		},
		/**
		* 调用store的load方法，重新载入整树数据
		* @method reload
		* @param {Object|String} param 参数对象
		*/
		reload: function(param){
			var _self = this,
				resultManage = _self.getResultManage();

			resultManage.length = 0;
			_self.fire('beforeReload');

			_self.set('isInit', false);
			_self.storeLoad(param, true);
		},
		/**
		* 获取store对象
		* @method getStore
		* @return {Object} store对象
		*/
		getStore: function(){
			return this.get('store');
		},
		/**
		* 调用store的searchTree方法，通过文本搜索树 此方法会触发searchTree事件
		* @method searchTree
		* @param {String} searchText 要搜索的文本
		* @return {Object} 搜索结果
		*/
		searchTree: function(searchText){
			var _self = this,
				store = _self.getStore();
			return store.searchTree(searchText);
		},

		// 关于结果
		/**
		* 获取结果对象 结果管理器中可以存放单结果，也可以存放多结果，根据不同树的使用场景不同 而下面的去结果方法，都可以正确的取到结果，一个值或是数组
		* @method getResultManage
		* @return {Array} 结果集列表
		*/
		getResultManage: function(){
			return this.get('resultManage');
		},
		/**
		* 获取选中结果的ID
		* @method getIdFromResult
		* @return {Number|String|Array} 选中结果的ID
		*/
		getIdFromResult: function(){
			var _self = this;
			return _self.getIdFromData(null);
		},
		/**
		* 从数据中，获取ID
		* @method getIdFromData
		* @param {Array} data 类似结果管理器的数据，为null,则直接去结果管理器
		* @return {Number|String|Array} 选中结果的ID
		*/
		getIdFromData: function(data){
			var _self = this,
				id = null;
			id = _self.traverseResult(function(result){
				return result[result.length - 1].id;
			}, data);
			return id;
		},
		/**
		* 获取选中结果的velue
		* @method getValueFromResult
		* @return {String|Array} 选中结果的velue
		*/
		getValueFromResult: function(){
			var _self = this;
			return _self.getValueFromData(null);
		},
		/**
		* 从数据中，获取velue
		* @method getValueFromData
		* @param {Array} data 类似结果管理器的数据，为null,则直接去结果管理器
		* @return {String|Array} 选中结果的velue
		*/
		getValueFromData: function(data){
			var _self = this,
				value = null;
			value = _self.traverseResult(function(result){
				return result[result.length - 1].value;
			}, data);
			return value;
		},
		/**
		* 获取结果的ID路径
		* @method getPathFromResult
		* @return {Array} ID路径
		*/
		getPathFromResult: function(){
			var _self = this;
			return _self.getPathFromData(null);
		},
		/**
		* 从数据中，获取ID路径
		* @method getPathFromData
		* @param {Array} data 类似结果管理器的数据，为null,则直接去结果管理器
		* @return {Array} ID路径
		*/
		getPathFromData: function(data){
			var _self = this,
				path = null;
			path = _self.traverseResult(function(result){
				var list = [];
				S.each(result, function(r){
					list.push(r.id);
				});
				return list;
			}, data);
			return path;
		},
		/**
		* 获取结果的value路径
		* @method getValuePathFromResult
		* @return {Array} value路径
		*/
		getValuePathFromResult: function(){
			var _self = this;
			return _self.getValuePathFromData(null);
		},
		/**
		* 从数据中，获取value路径
		* @method getValuePathFromData
		* @param {Array} data 类似结果管理器的数据，为null,则直接去结果管理器
		* @return {Array} value路径
		*/
		getValuePathFromData: function(data){
			var _self = this,
				valuePath = null;
			valuePath = _self.traverseResult(function(result){
				var list = [];
				S.each(result, function(r){
					list.push(r.value);
				});
				return list;
			}, data);
			return valuePath;
		},
		/**
		* 获取结果的value路径字符串形式
		* @method getValueStrFromResult
		* @param {String} joinStr 连接符，默认为 ' > '
		* @return {String|Array} value路径字符串形式
		*/
		getValueStrFromResult: function(joinStr){
			var _self = this;
			return _self.getValueStrFromData(null, joinStr);
		},
		/**
		* 从数据中，获取value路径字符串形式
		* @method getValueStrFromData
		* @param {Array} data 类似结果管理器的数据，为null,则直接去结果管理器
		* @param {String} joinStr 连接符，默认为 ' > '
		* @return {String|Array} value路径字符串形式
		*/
		getValueStrFromData: function(data, joinStr){
			var _self = this,
				valueStr = null;
			joinStr = joinStr || ' > ';
			valueStr = _self.traverseResult(function(result){
				var list = [];
				S.each(result, function(r){
					var _value = r.value;
					list.push(_value);
				});
				return list.join(joinStr);
			}, data);
			return valueStr;
		},
		/**
		* 从结果管理其中，获取所有叶子节点列表
		* @method getAllLeafsFromResult
		* @return {Array} 所有子节点的节点路径
		*/
		getAllLeafsFromResult: function(){
			var _self = this;
			return _self.getAllLeafsFromData(null);
		},
		/**
		* 从数据中，获取所有叶子节点列表
		* @method getAllLeafsFromData
		* @param {Array} data 类似结果管理器的数据，为null,则直接去结果管理器
		* @return {Array} 所有子节点的节点路径
		*/
		getAllLeafsFromData: function(data){
			var _self = this,
				store = _self.getStore(),
				_result = [];
				
			_self.traverseResult(function(result){
				var lastData = result[result.length - 1],
					_leafsList = null;
				
				if(!lastData.isleaf){
					_leafsList = store.getLeafsById(lastData.id);
					S.each(_leafsList, function(l){
						_result.push(result.concat(l));
					});
				}else{
					_result.push(S.clone(result));
				}
			}, data);
				
			return _result;
		},
		
		/**
		* 根据resultInput的值 初始化数据 触发 initData 事件
		* @method initData
		* @return {String|Number|Array} 需要初始化的id 或 id列表
		*/
		initData: function(){
			var _self = this,
				id = _self.getIdFormResultInput();

			_self.fire('initData', {id: id});

			return id;
		},
		/**
		* 从存储结果的input中获取id, 根据 resultType
		* @method getIdFormResultInput
		* @return {Number|String} id
		*/
		getIdFormResultInput: function(){
			var _self = this,
				resultInput = _self.get('resultInput'),
				resultTypeList = _self.get('resultType').split(' '),
				result = null,
				id = null,
				targetResult;
			if(resultInput){
				result = S.JSON.parse(resultInput.val());
				if(result !== null){
					if(S.inArray('result', resultTypeList)){
						id = _self.traverseResult(function(r){
							return r[r.length - 1].id;
						}, result['result']);
					}else if(S.inArray('id', resultTypeList)){
						id = result['id'];
					}else if(S.inArray('path', resultTypeList)){
						id = _self.traverseResult(function(p){
							return p[p.length - 1];
						}, result['path']);
					}
				}
			}
			return id;
		},
		/**
		* 判断当前结果集是否为空
		* @method isBlankResult
		* @param {Array} [data] 其他数据
		* @return {Boolean} 是否为空
		*/
		isBlankResult: function(data){
			var _self = this,
				resultManage = data || _self.getResultManage(),
				isBlank = false;
			if(resultManage.length === 0){
				isBlank = true;
			}
			return isBlank;
		},
		/**
		* 判断当前结果是不是叶子节点 如果是多结果，则只有全都是叶子节点 才返回true
		* @method isLeafResult
		* @param {Array} [data] 其他数据
		* @return {Boolean} 是否是叶子节点 若结果集为空，也会返回false
		*/
		isLeafResult: function(data){
			var _self = this,
				resultManage = data || _self.getResultManage(),
				isLeaf = false,
				_isLeaf = null;
			_isLeaf = _self.traverseResult(function(result){
				return result[result.length - 1].isleaf;
			});
			if(S.isBoolean(_isLeaf)){
				isLeaf = _isLeaf;
			}else if(isLeaf === null){
				isLeaf = false;
			}else if(S.isArray(_isLeaf)){
				isLeaf = S.reduce(_isLeaf, function(a, b){
					return a && b;
				});
			}
			return isLeaf;
		},
		/**
		* 多结果管理功能 遍历结果管理器
		* @method traverseResult
		* @param {Function} func 需要执行的方法 参数为单结果对象
		* @param {Array} [data] 其他数据
		* @return {String|Array} 处理之后的数据
		*/
		traverseResult: function(func, data){
			var _self = this,
				resultManage = data || _self.getResultManage(),
				outResult = null;
			if(!_self.isBlankResult(data)){
				if(_self.isMultipleResult(data)){
					outResult = [];
					S.each(resultManage, function(result){
						outResult.push(func(result));
					});
				}else{
					outResult = func(resultManage);
				}
			}
			return outResult;
		},
		/**
		* 判断结果是否为多结果
		* @method isMultipleResult
		* @param {Array} [data] 其他数据
		* @return {boolean} 结果
		*/
		isMultipleResult: function(data){
			var _self = this,
				resultManage = data || _self.getResultManage(),
				isMultiple = false;
			if(resultManage.length > 0 && S.isArray(resultManage[0])){
				isMultiple = true;
			}
			return isMultiple;
		},
		/**
		* 销毁tree对象
		* @method destroy
		*/
		destroy: function(){
			var _self = this,
				store = _self.getStore(),
				resultManage = _self.getResultManage(),
				container = _self.get('container');

			_self.fire('beforeDestroy');

			store.destroy();
			resultManage.length = 0;
			container[0].innerHTML = '';
			_self.detach();
			_self = null;
		},
		// tree初始化
		_init: function(){
			var _self = this,
				container = S.one('#' + _self.get('renderTo')),
				resultInput = S.one('#' + _self.get('resultId')),
				resultManage = [],
				contentTemplate = _self.get('contentTemplate');
			_self._initStore();
			_self.set('container', container);

			if(resultInput){
				_self.set('resultInput', resultInput);
			}

			_self.set('resultManage', resultManage);

			_self._initEvent();

			// 初始化节点模板
			if(contentTemplate){
				_self.set('contentTemplateObj', new XTemplate(contentTemplate));
			}

		},
		// 初始化事件
		_initEvent: function(){
			var _self = this,
				store = _self.getStore();

			// 代理store的searchTree事件
			store.on('searchTree', function(e){
				_self.fire('searchTree', {
					text: e.text,
					pathList: e.pathList,
					valuePathList: e.valuePathList,
					result: e.result
				});
			});
			// 代理store的load事件
			store.on('load', function(e){
				_self.fire('load', {
					data: e.data,
					id: e.id,
					param: e.param
				});
			});
			// 数据加载完成
			_self.on('load', function(e){
				_self._loadTree();
				if(!_self.get('isInit')){
					_self.initData();
					_self.set('isInit', true);
				}
				_self.fire('loadFinished');
			});
			// 结果更新
			_self.on('resultUpdate', function(e){
				_self._updateResult();
			});
		},
		// 数据加载完成时调用此方法
		_loadTree: function(){
			var _self = this;
			_self.fire('loadTree');
		},
		// 获取整理store的配置项
		_getStoreConfig: function(){
			var _self = this,
				storeConfig = _self.get('storeConfig');
			S.mix(storeConfig, {
				url: _self._getStoreUrl(),
				idKey: _self.get('idKey'),
				param: _self.get('param'),
				data: _self.get('data'),
				isJsonp: _self.get('isJsonp'),
				autoLoad: false
			});
			return storeConfig;
		},
		// 初始化store
		_initStore: function(){
			var _self = this,
				store = _self.get('store'),
				storeConfig;
			if(!store){
				storeConfig = _self._getStoreConfig();
				store = new Store(storeConfig);
			}
			_self.set('store', store);
		},
		// 获取url 可以重写此方法以获得更灵活的url获取方式
		_getStoreUrl: function(){
			return this.get('url');
		},
		// 增加单结果集堆栈
		_pushResult: function(nodeData){
			var _self = this,
				resultManage = _self.getResultManage(),
				_result = {},
				valueStr;

			_result.id = nodeData.id;
			_result.value = nodeData.value;
			_result.isleaf = nodeData.isleaf;
			resultManage.push(_result);

			_self.fire('resultPush', {result: resultManage, resultObj: _result});
			_self.fire('resultUpdate', {result: resultManage});
		},
		// 减少单结果集堆栈
		_popResult: function(){
			var _self = this,
				resultManage = _self.getResultManage(),
				popResult = resultManage.pop();

			_self.fire('resultPop', {result: resultManage, resultObj: popResult});
			_self.fire('resultUpdate', {result: resultManage});
		},
		// 根据模板获取content
		_getContent: function(data){
			var _self = this,
				contentTemplateObj = _self.get('contentTemplateObj'),
				adapterForNode,
				content;
			if(contentTemplateObj){
				content =  contentTemplateObj.render(data);
			}else{
				adapterForNode = _self.getStore().get('adapterForNode');
				content = data[adapterForNode.value];
			}
			return content;
		},
		// 更新结果
		_updateResult: function(){
			var _self = this,
				resultInput = _self.get('resultInput'),
				resultTypeList = _self.get('resultType').split(' '),
				result = {},
				_result = null;

			if(resultInput){
				if(S.inArray('result', resultTypeList)){
					_result = _self.getResultManage();
					if(_result && _result.length > 0){
						result['result'] = _result;
					}
				}
				if(S.inArray('id', resultTypeList)){
					_result = _self.getIdFromResult();
					if(_result !== null && _result !== ''){
						result['id'] = _result;
					}
				}
				if(S.inArray('value', resultTypeList)){
					_result = _self.getValueFromResult();
					if(_result !== null && _result !== ''){
						result['value'] = _result;
					}
				}
				if(S.inArray('path', resultTypeList)){
					_result = _self.getPathFromResult();
					if(_result && _result.length > 0){
						result['path'] = _result;
					}
				}
				if(S.inArray('valuePath', resultTypeList)){
					_result = _self.getValuePathFromResult();
					if(_result && _result.length > 0){
						result['valuePath'] = _result;
					}
				}
				if(S.inArray('valueStr', resultTypeList)){
					_result = _self.getValueStrFromResult();
					if(_result !== null && _result !== ''){
						result['valueStr'] = _result;
					}
				}
				resultInput.val(S.isEmptyObject(result) ? '' : S.JSON.stringify(result));
			}
		}
	});

	return Base;

}, {requires: ['./store', 'xtemplate', 'core']});


/** 
* Tree 普通树 支持多选
* @version 1.0
* @date: 2013-05-3
*/
KISSY.add('gallery/trees/1.0/tree',function(S, STree, Base){
	var DOM = S.DOM,
		Event = S.Event;

	/**
	* Tree 普通树 - 以层级方式表现的普通树,支持多选，利用了kissy的tree 继承了 Tree.Base的结果管理与数据缓冲对象
	* @class Trees.Tree
	* @module Trees
	* @author 桐人<wwwfuzheng@qq.com>
	* @extend Trees.Base
	* @constructor Tree
	* @param {Object} config 配置项
	*/
	function Tree(config){
		var _self = this;
		config = S.merge(Tree.config, config);
		Tree.superclass.constructor.call(_self, config);
		//支持的事件
		_self.events = [
			/**  
			* 代理 Tree 的 click 事件 当树节点被点击后触发
			* @event click
			* @param {event} e  事件对象
			* @param {Object} e.targetNode  树的节点对象
			*/
			'click',
			/**  
			* 节点选中后触发的事件，注意：点击节点的时候，不会触发该事件，只会触发click
			* @event selected
			* @param {event} e  事件对象
			* @param {Object} e.targetNode  树的节点对象
			*/
			'selected',
			/**  
			* 代理 Tree 的 expand 事件 当树节点扩展后触发
			* @event expand
			* @param {event} e  事件对象
			* @param {Object} e.targetNode  树的节点对象
			*/
			'expand',
			/**  
			* 代理 Tree 的 collapse 事件 当树节点收缩后触发
			* @event collapse
			* @param {event} e  事件对象
			* @param {Object} e.targetNode  树的节点对象
			*/
			'collapse'
		];
		_self._initTree();
	}
	Tree.config = {
		/**
		* tree根节点的标题
		* @property title
		* @type String
		* @default  'Tree'
		*/
		title: 'Tree',
		/**
		* 是否初始展示一级节点 （选填）
		* @property showRootNode
		* @type Boolean
		* @default  true
		*/
		showRootNode: true,
		/**
		* 是否初始展示全部节点 （选填）
		* @property showAll
		* @type Boolean
		* @default  false
		*/
		showAll: false,
		/**
		* 是否为多选树 （选填）
		* @property checkable
		* @type Boolean
		* @default  false
		*/
		checkable: false,
		/**
		* 树html节点class前缀，用于自定义皮肤 （选填）
		* @property prefixCls
		* @type String
		* @default  ''
		*/
		prefixCls: '',
		/**
		* 是否使用懒加载来优化多节点效率问题 默认不使用 （选填）
		* @property isLazyLoad
		* @type Boolean
		* @default  false
		*/
		isLazyLoad: false,
		/**
		* 懒加载步长
		* @property lazyCount
		* @type Number
		* @default  5
		*/
		lazyCount: 5,
		/**
		* 懒加载间隔
		* @property lazyTime
		* @type Number
		* @default  300
		*/
		lazyTime: 300
	};
	// 继承自Tree.Base
	S.extend(Tree, Base);
	S.augment(Tree, {
		/**
		* 获取kissy树对象
		* @method getTree
		* @return {Object} kissy树对象
		*/
		getTree: function(){
			return this.get('tree');
		},
		/**
		* 获取节点的子节点
		* @method getChildrenByNode
		* @param {Object} node 目标节点
		* @return {Array} 子节点列表
		*/
		getChildrenByNode: function(node){
			if(node){
				return node.get('children');
			}else{
				return [];
			}
		},
		/**
		* 初始化树的节点
		* @method initTreeNode
		* @param {Boolean} isShowRootNode 是否是根节点
		*/
		initTreeNode: function(isShowRootNode){
			var _self = this,
				tree = _self.getTree(),
				showAll = _self.get('showAll'),
				showRootNode = isShowRootNode === undefined ? _self.get('showRootNode') : isShowRootNode;
			if(showAll){
				tree.expandAll();
			}else if(showRootNode){
				_self.nodeExpand(tree);
			}
		},
		/**
		* 给节点增加子节点 子节点数据由这个节点的id在store中查询而来
		* @method addNodes
		* @param {Object} node 目标节点对象
		* @param {Boolean} isLazyLoad 是否启用异步懒加载
		* @return {Object} 添加子节点后的节点对象
		*/
		addNodes: function(node, isLazyLoad){
			var _self = this,
				lazyLoadProcessId = null;
			if(node){
				isLazyLoad = isLazyLoad === undefined ? _self.get('isLazyLoad') : isLazyLoad;

				if(isLazyLoad){
					lazyLoadProcessId = _self._initLazyLoadProcess(_self._addNodesLazyLoad);
				}
				_self._addNodes(node, 0, lazyLoadProcessId);
			}
			return node;
		},		
		
		/**
		* 展开节点
		* @method nodeExpand
		* @param {Object} node 目标节点对象
		*/
		nodeExpand: function(node, isLazyLoad){
			var _self = this;
			if(node){
				node.set('expanded', true);
				isLazyLoad = isLazyLoad === undefined ? _self.get('isLazyLoad') : isLazyLoad;
				// 代理tree的 expand 事件
				_self.fire('expand', {targetNode: node, isLazyLoad: isLazyLoad});
			}
		},
		/**
		* 收起节点
		* @method nodeCollapse
		* @param {Object} node 目标节点对象
		*/
		nodeCollapse: function(node){
			if(node){
				node.set('expanded', false);
			}
		},
		/**
		* 选中节点，会触发 selected 事件
		* @method nodeSelect
		* @param {Object} node 目标节点对象
		* @param {Boolean} [isSelect] 是否需要选中 默认为选中
		* @return {Object} 自身对象
		*/
		nodeSelect: function(node, isSelect){
			var _self = this,
				checkable = _self.get('checkable'),
				isSelect = isSelect === undefined ? true : isSelect;
			if(!node){
				return;
			}
			if(checkable){
				if(isSelect){
					node.set('checkState', STree.CheckNode.CHECK);
				}else{
					node.set('checkState', STree.CheckNode.EMPTY);
				}
			}else{
				if(isSelect){
					node.select();
					node.set('focused', true);
				}else{
					node.set('selected', false);
					node.set('focused', false);
				}
			}
			if(isSelect){
				_self.fire('selected', {targetNode: node});
			}
			return _self;
		},
		/**
		* 判断目标节点是否为选中状态
		* @method isNodeSelected
		* @param {Object} node 目标节点对象
		* @return {Boolean} 是否选中结果
		*/
		isNodeSelected: function(node){
			var _self = this,
				checkable = _self.get('checkable'),
				isSelected = false;
			if(!node){
				return;
			}
			if(checkable){
				isSelected = (node.get('checkState') === STree.CheckNode.CHECK);
			}else{
				isSelected = node.get('selected');
			}
			return isSelected;
		},
		/**
		* 通过id定位并选中节点 id可为id列表
		* @method showNodeById
		* @param {String|number|Array} id id或id列表 
		* @return {Object} 自身对象
		*/
		showNodeById: function(id, isClear){
			var _self = this,
				store = _self.getStore(),
				path = [],
				_path = [];
			if(id){
				if(S.isArray(id)){
					S.each(id, function(_id){
						_path = store.getPathById(_id);
						if(_path.length > 0){
							path.push(store.getPathById(_id));
						}
					});
				}else{
					path = store.getPathById(id);
				}
			}
			_self.showNodeByPath(path, isClear);
			return _self;
		},
		/**
		* 通过path定位并选中节点 path可为path列表
		* @method showNodeByPath
		* @param {Array} path  path或path列表 
		* @return {Object} 自身对象
		*/
		showNodeByPath: function(path, isClear){
			var _self = this,
				isClear = isClear === undefined ? true : isClear;
			if(isClear){
				_self.clearSelect();
			}
			if(path && path.length > 0){
				if(_self.isMultipleResult(path)){
					S.each(path, function(p){
						_self._showNodeByPath(p);
					});
				}else{
					_self._showNodeByPath(path);
				}
			}
			return _self;
		},
		/**
		* 清空树的选中，初始化树的展开状态
		* @method clearSelect
		* @return {Object} 自身对象
		*/
		clearSelect: function(){
			var _self = this,
				tree = _self.getTree();
			_self.nodeSelect(tree, false);
			tree.collapseAll();
			_self.initTreeNode();
			return _self;
		},
		/**
		* 遍历树的选择结果 会触发 resultUpdate 事件
		* @method getTreeResult
		* @return {Array} 结果集
		*/
		getTreeResult: function(){
			var _self = this,
				tree = _self.getTree(),
				result = [],
				resultList = [],
				_traverse;

			_traverse = function(node, deep){
				deep = deep || 0;
				var children = node.get('children');
				if(children){
					for(var i = 0; i < children.length; i++){
						var l = result.length - deep - 1;
						for(var j = 0; j < l; j++){
							result.pop();
						}
						result[deep] = {};
						result[deep].id = children[i].get('nodeId');
						result[deep].value = children[i].get('content');
						result[deep].isleaf = children[i].get('isLeaf');
						
						// 遍历全树，收集选中的节点，不遍历选中节点的子节点
						if(_self.isNodeSelected(children[i])){
							resultList.push(S.clone(result));
						}else if(!children[i].get('isLeaf')){
							_traverse(children[i], deep + 1);
						}
						/*if(!_self.get('isGetAllSelectedChildren')){
							// 遍历全树，收集选中的节点，不遍历选中节点的子节点
							if(_self.isNodeSelected(children[i])){
								resultList.push(S.clone(result));
							}else if(!children[i].get('isLeaf')){
								_traverse(children[i], deep + 1);
							}
						}else{
							// 遍历全树，只收集选中的叶子节点
							if(children[i].get('isLeaf')){
								if(_self.isNodeSelected(children[i])){
									resultList.push(S.clone(result));
								}
							}else{
								_traverse(children[i], deep + 1);
							}
						}*/	
									
					}
				}
				return false;			
			};

			_traverse(tree);
			
			_self.set('resultManage', resultList);

			_self.fire('resultUpdate', {result: resultList});	
			
			return resultList;		
		},

		/**
		* 获取节点的子节点数据
		* @method getNodeChildrenData
		* @param {Object} node 节点对象
		* @return {Array} 子节点数据
		*/
		getNodeChildrenData: function(node){
			var _self = this,
				nodeId = node.get('nodeId') || null,
				nodesData = _self._getNodesData(nodeId, node);
			return nodesData;
		},
		/**
		* 重置树的标题
		* @method resetTitle
		* @param {String} title 标题
		*/
		resetTitle: function(title){
			var _self = this;
			_self.getTree().set('content', title);
		},

		// 初始化
		_initTree: function(){
			var _self = this;

			// 初始化懒加载对象
			_self.set('lazyLoadManage', {});
			// 初始化根节点
			_self._newTree();
			// 初始化时间
			_self._initTreeEvent();
			// 加载数据
			_self.storeLoad();
		},
		// 初始化事件
		_initTreeEvent: function(){
			var _self = this,
				tree = _self.getTree();
			// 数据load完成时
			/*_self.on('loadTree', function(e){
			});*/

			// 数据初始化时完成时
			_self.on('initData', function(e){
				_self.initTreeNode(true);
				_self._checkNodeLoaded(_self.getTree(), _self.showNodeById, [e.id]);
			});

			// 代理tree的 expand 事件
			tree.on('expand', function(e){
				_self.nodeExpand(e.target);
				//_self.fire('expand', {targetNode: e.target});
			});

			// 展开时加载子节点
			_self.on('expand', function(e){
				var node = e.targetNode;
				if(!node.get('children').length){
					_self.addNodes(node, e.isLazyLoad);
				}
			});

			// 代理tree的 collapse 事件
			tree.on('collapse', function(e){
				_self.fire('collapse', {targetNode: e.target});
			});

			// 代理tree的 click 事件
			tree.on('click', function(e){
				_self.fire('click', {targetNode: e.target});
			});
			
			// 切换树的数据
			_self.on('beforeReload', function(){
				_self._destroyTreeChildren();				
			});
			
			// 销毁
			_self.on('beforeDestroy', function(){
				_self._destroyTree();
			});
		},
		// 实例化kissy Tree
		_newTree: function(){
			var _self = this,
				checkable = _self.get('checkable'),
				treeConfig = {
					'content': _self.get('title'),
					'prefixCls': _self.get('prefixCls'),
					'isLeaf': false,
					'tooltip': _self.get('title'),
					'render': '#' + _self.get('renderTo')
				},
				tree = null;
			if(!checkable){
				tree = new STree(treeConfig);
			}else{
				tree = new STree.CheckTree(treeConfig);
			}
			tree.render();
			_self.set('tree', tree);
		},
		// 实例化kissy 节点
		_newNode: function(id, content, title, isleaf, checkState){
			var _self = this,
				checkable = _self.get('checkable'),
				tree = _self.getTree(),
				nodeConfig = {
					'content': content,
					'nodeId': id,
					'prefixCls': _self.get('prefixCls'),
					'isLeaf': isleaf,
					'tooltip': title,
					'tree': tree
				},
				node = null;
			if(!checkable){
				node = new STree.Node(nodeConfig);
			}else{
				nodeConfig = S.merge(nodeConfig, {
					'checkState': checkState ===  STree.CheckNode.CHECK ? STree.CheckNode.CHECK : STree.CheckNode.EMPTY
				});
				node = new STree.CheckNode(nodeConfig);
			}

			return node;
		},

		// 添加节点
		_addNodes: function(node, index, lazyLoadProcessId){
			var _self = this,
				adapterForNode = _self.getStore().get('adapterForNode'),
				nodesData = _self.getNodeChildrenData(node),
				checkState = node.get('checkState');

			index = index === undefined ? 0 : index;
		
			for(var i = index; i < nodesData.length; i++){
				var id = nodesData[i][adapterForNode.id],
					content = _self._getContent(nodesData[i]),
					title = nodesData[i][adapterForNode.value],
					isleaf = nodesData[i][adapterForNode.isleaf];
				
				node.addChild(_self._newNode(id, content, title, isleaf, checkState));

				// 延时加载的控制
				if(!!lazyLoadProcessId){
					if(i < nodesData.length - 1){
						if(!_self._lazyLoad(node, i, lazyLoadProcessId)){
							return false;
						}
					}else{
						_self._destroyLazyLoadProcess(lazyLoadProcessId);
					}
				}
			}		
		},
		// 增加节点的延迟加载方法
		_addNodesLazyLoad: function(lazyLoadProcessId){
			var _self = this,
				lazyTime = _self.get('lazyTime'),
				lazyLoadManage = _self.get('lazyLoadManage'),
				lazyLoadObj = lazyLoadManage[lazyLoadProcessId];

			setTimeout(function(){
				_self._addNodes(lazyLoadObj.node, lazyLoadObj.index, lazyLoadProcessId);
			}, lazyTime);					
		},

		// 初始化延迟加载进程
		_initLazyLoadProcess: function(func){
			var _self = this,
				lazyLoadManage = _self.get('lazyLoadManage'),
				lazyLoadProcessId = S.guid(),
				lazyLoadObj = {
					func: func,
					node: null,
					count: 0,
					index: 0
				};

			lazyLoadManage[lazyLoadProcessId] = lazyLoadObj;

			return lazyLoadProcessId;		
		},
		// 销毁延迟加载进程
		_destroyLazyLoadProcess: function(lazyLoadProcessId){
			var _self = this,
				lazyLoadManage = _self.get('lazyLoadManage');
			delete lazyLoadManage[lazyLoadProcessId];
			_self.fire('destroyLazyLoadProcess', {id: lazyLoadProcessId});
		},

		// 控制延迟加载
		_lazyLoad: function(node, index, lazyLoadProcessId){
			var _self = this,
				lazyCount = _self.get('lazyCount'),
				lazyLoadManage = _self.get('lazyLoadManage'),
				lazyLoadObj = lazyLoadManage[lazyLoadProcessId];

			lazyLoadObj.count++;

			if(!(lazyLoadObj.count < lazyCount)){
				lazyLoadObj.index = index + 1;
				lazyLoadObj.node = node;
				lazyLoadObj.count = 0;
				lazyLoadObj.func.call(_self, lazyLoadProcessId);
				return false;
			}

			return true;
		},
		// 检测节点的子节点是否加载完成，并延迟执行某方法，直到节点的子节点完全载入完成
		_checkNodeLoaded: function(node, func, arg){
			var _self = this,
				nodesData = _self.getNodeChildrenData(node),
				isLazyLoad = _self.get('isLazyLoad'),
				checkTimer,
				intervalFunc = function(){
					var nodes = _self.getChildrenByNode(node);
					if(!(nodes.length < nodesData.length)){
						clearInterval(checkTimer);
						return func.apply(_self, arg);
					}
				};

			arg.push(node);
		
			if(!isLazyLoad){
				return func.apply(_self, arg);
			}else{
				checkTimer = setInterval(intervalFunc, 100);
			}
		},

		// 根据节点id获取子节点数据
		_getNodesData: function(id, treeNode){
			 var _self = this,
				 store = _self.getStore(),
				 nodesData = [],
				 node;
			 if(id){
				node = store.getNodeById(id);
				if(store.isTreeReady(node, function(){
					_self.addNodes(treeNode);
				})){
					nodesData = store.getChildrenByNode(node);
				}
			 }else{
				nodesData = store.getTreeData();
			 }
			 return nodesData;				
		},

		// 通过path获取节点并选中节点
		_showNodeByPath: function(path){
			var _self = this,
				tree = _self.getTree(),
				nodeList = _self.getChildrenByNode(tree);

			return _self._getNodeByPath(nodeList, path, 0);
		},
		// 寻找节点
		_getNodeByPath: function(nodeList, path, index){
			var _self = this,
				id = path[index],
				node = null;

			S.each(nodeList, function(n){
				if(n.get('nodeId') === id){
					node = n;
					return false;
				}
			});
			// 展开节点
			if(node){
				if(index < path.length - 1){
					_self.nodeExpand(node);
					return _self._checkNodeLoaded(node, _self._getNextNodeByPath, [path, index + 1]);
				}else{
					// 这句话迫不得已写在这里了 。。。 好恶心
					_self.nodeSelect(node);	
				}			
			}
			return node;
		},
		// 寻找下一级节点
		_getNextNodeByPath: function(path, index, node){
			var _self = this;
				nodeList = _self.getChildrenByNode(node);
			return _self._getNodeByPath(nodeList, path, index);
		},
		// 销毁kissy tree对象
		_destroyTree: function(){
			var _self = this,
				tree = _self.getTree();
			tree.destroy();
		},
		// 销毁kissy tree下面的所有对象
		_destroyTreeChildren: function(){
			var _self = this,
				tree = _self.getTree();
			tree.removeChildren(true);
		}
	});

	return Tree;

},{requires: ['tree', './base', './tree.css']});


/** 
* ViewStore 视图功能树专用数据缓冲对象
* @version 2.0
*/
KISSY.add('gallery/trees/1.0/viewstore',function(S, Store){


	/**
	* ViewStore 视图功能树专用数据缓冲对象 继承自Tree.Store 拥有其全部配置项、方法及事件
	* @class Trees.ViewStore
	* @module Trees
	* @author 桐人<wwwfuzheng@qq.com>
	* @extend Trees.Store
	* @constructor ViewStore
	* @param {Object} config 配置项 同 Tree.Store配置项
	*/
	function ViewStore(config){
		var _self = this;
		config = S.merge(ViewStore.config, config);
		ViewStore.superclass.constructor.call(_self, config);
		//支持的事件
		_self.events = [	
			/**  
			* 增加路径时 触发此事件
			* @event pushPath
			* @param {event} e  事件对象
			* @param {String} e.id 增加的节点id
			* @param {Array} e.path 增加后的路径
			*/
			'pushPath',
			/**  
			* 减少路径时 触发此事件
			* @event  popPath
			* @param {event} e  事件对象
			* @param {String} e.id 减少的节点id
			* @param {Array} e.path 减少后的路径
			*/
			'popPath',
			/**  
			* 增加视图时 触发此事件
			* @event  pushView
			* @param {event} e  事件对象
			* @param {Object} e.view 增加的视图
			*/
			'pushView',
			/**  
			* 减少视图时 触发此事件
			* @event  popView
			* @param {event} e  事件对象
			* @param {Object} e.view 减少的视图
			*/
			'popView',
			/**  
			* 通过text遍历视图搜索后 触发此事件
			* @event  searchView
			* @param {event} e  事件对象
			* @param {String} e.text 搜索的文本值
			* @param {Array} e.data 搜索结果
			* @param {Number} e.index 搜索的视图在视图列表里的索引值
			*/
			'searchView',
			/**  
			* 视图选中项改变时 触发此事件
			* @event  changeSelect
			* @param {event} e  事件对象
			* @param {Array} e.view 视图对象
			* @param {Array} e.id 选中的节点id
			*/
			'changeSelect'
		];
		_self._initView();
	}

	S.extend(ViewStore, Store);

	S.augment(ViewStore, {
		/**
		* 获取视图管理器
		* @method getViewManager
		* @return {Object} 视图管理器
		*/
		getViewManager: function(){
			return this.get('viewManager');
		},
		/**
		* 通过path设置视图列表
		* @method getViewsByPath
		* @param {Array} path 选填，若没有则只返回一级菜单的视图
		* @return {Object} 视图管理器
		*/
		getViewsByPath: function(path){
			path = path || [];
			var _self = this,
				viewManager = _self.getViewManager(),
				viewPathLength = viewManager.viewPath.length,
				adapterForNode = _self.get('adapterForNode'),
				changeIndex = path.length,
				node = _self.getNodeByPath(path);
			_self.set('targetPath', path);
			// 确保数据已经准备好
			if(!_self.isTreeReady(node , function(){
				_self.getViewsByPath(path);
			})){
				return false;
			}
			// 若path为空，则先设置基础视图，及一级列表的视图
			if(path.length === 0){
				_self._setBaseView();
			}
			// 获取changIndex 即从哪个视图开始变化的索引
			S.each(path, function(id, i){
				if(id !== viewManager.viewPath[i]){
					changeIndex = i;
					return false;
				}
			});
			// 从堆栈内删除视图路径
			for(var j = 0; j < (viewPathLength - changeIndex); j++){
				_self._popViewPath();
			}
			// 按堆栈添加视图路径
			for(var k = changeIndex; k < path.length; k++){
				_self._pushViewPath(path[k]);
			}
			
			return viewManager;
		},
		/**
		* 通过id设置视图列表
		* @method getViewsById		
		* @param {String|Number} id 选填，若没有则至返回一级菜单的视图
		* @return {Object} 视图管理器
		*/
		getViewsById: function(id){
			var _self = this,
				path = _self.getPathById(id);
			return _self.getViewsByPath(path);		
		},
		/**
		* 通过view对象，获取视图的索引
		* @method getViewIndex		
		* @param {Object} view 视图对象
		* @return {Number} 视图的索引
		*/
		getViewIndex: function(view){
			var _self = this,
				viewManager = _self.getViewManager(),
				index = null;
			S.each(viewManager.views, function(v, i){
				if(v === view){
					index = i;
					return false;
				}
			});
			return index;
		},
		/**
		* 通过文本搜索视图 此方法会触发searchView事件
		* @method searchView		
		* @param {String} searchText 要搜索的文本
		* @param {Number} index 要搜索的视图索引
		* @return {Arrat} 搜索结果节点数据列表
		*/
		searchView: function(searchText, index){
			var _self = this,
				adapterForNode = _self.get('adapterForNode'),
				viewManager = _self.getViewManager(),
				view = viewManager.views[index],
				searchData;

			searchText = searchText || '';
			searchData = S.filter(view.list, function(node){
				return node[adapterForNode.value].indexOf(searchText) > -1;
			});
				
			_self.fire('searchView', {data: searchData, index: index, text: searchText});

			return searchData;
		},
		// 初始化
		_initView: function(){
			var _self = this;
			_self._initViewManage();
			_self._initViewEvent();
		},
		// 初始化事件
		_initViewEvent: function(){		
			var _self = this;
			// 增加view
			_self.on('pushPath', function(e){
				_self._pushView(e.id, e.path);
			});
			// 减少view
			_self.on('popPath', function(e){
				_self._popView();
			});
		},

		// 初始化视图管理器
		_initViewManage: function(){
			var _self = this,
				viewManager = {
					viewPath: [],
					views: []
				};
			_self.set('viewManager', viewManager);		
		},
		// 初始化view 当path为[] 时 获取一级菜单
		_getViewByPath: function(path){
			path = path || [];
			var _self = this,
				view = {};
			view.list = _self._getDataOfView(path);
			view.selectedId = null;
			return view;
		},
		// 初始化一级菜单view 此方法会触发pushView事件
		_setBaseView: function(){
			var _self = this,
				viewManager = _self.getViewManager(),
				baseView;
			if(viewManager.views.length === 0){
				baseView = _self._getViewByPath();
				viewManager.views.push(baseView);
				_self.fire('pushView', {view: baseView});
			}
		},
		// 根据path 获取view的数据
		_getDataOfView: function(path){
			path = path || [];
			var _self = this,
				adapterForNode = _self.get('adapterForNode'),
				nodeData = _self.getChildrenByPath(path),
				viewData = _self.dataFilter(nodeData);
			return viewData;
		},
		// 增加path 触发pushPath事件
		_pushViewPath: function(id){		
			var _self = this,
				viewManager = _self.getViewManager();
			viewManager.viewPath.push(id);
			_self.fire('pushPath', {id: id, path: viewManager.viewPath});
			return viewManager.viewPath;
		},
		// 减少path 触发popPath事件
		_popViewPath: function(){		
			var _self = this,
				viewManager = _self.getViewManager(),
				id;
			if(viewManager.viewPath.length === 0){
				return;
			}
			id = viewManager.viewPath.pop();
			_self.fire('popPath', {id: id, path: viewManager.viewPath});
			return viewManager.viewPath;
		},
		// 增加view 触发pushView事件
		_pushView: function(id, path){
			var _self = this,
				viewManager = _self.getViewManager(),
				newView = _self._getViewByPath(path),
				baseView,
				lastView;

			_self._setBaseView();

			lastView = viewManager.views[viewManager.views.length - 1];
			_self._changeViewSelect(lastView, id);

			viewManager.views.push(newView);
			_self.fire('pushView', {view: newView});

			return newView;
		},
		// 减少view 触发popView事件
		_popView: function(){
			var _self = this,
				viewManager = _self.getViewManager(),
				popView,
				lastView;
			popView = viewManager.views.pop();
			_self.fire('popView', {view: popView});

			lastView = viewManager.views[viewManager.views.length - 1];
			if(lastView){
				_self._changeViewSelect(lastView, null);
			}

			return popView;
		},
		// 改变view的选中项 触发changeSelect事件
		_changeViewSelect: function(view, id){
			var _self = this;
			view.selectedId = id;
			_self.fire('changeSelect', {view: view, id: id});
		},
		// 销毁ViewStore 清空 viewManager
		_destroyView: function(){
			var _self = this,
				viewManager = _self.getViewManager();
			viewManager.viewPath = [];
			viewManager.views = [];
		}
	});

	return ViewStore;

},{requires: ['./store']});



/**
* View 视图功能的Tree
* @version 2.0
*/
KISSY.add('gallery/trees/1.0/view',function(S, Base, ViewStore){

	var DOM = S.DOM,
		Event = S.Event;

	/**
	* View 视图功能的Tree 负责视图的管理、视图内搜索 继承自Tree.Base 拥有其全部配置项、方法及事件
	* @class Trees.View
	* @module Trees
	* @author 桐人<wwwfuzheng@qq.com>
	* @extend Trees.Base
	* @constructor View
	* @param {Object} config 配置项 同 Tree.Base配置项
	*/
	function View(config){
		var _self = this;
		config = S.merge(View.config, config);
		if(!config.renderTo || !DOM.get('#' + config.renderTo)){
			throw 'please assign the id of render Dom!';
		}
		View.superclass.constructor.call(_self, config);
		//支持的事件
		_self.events = [
			/**
			* 增加堆栈list时触发此事件
			* @event pushList
			* @param {event} e  事件对象
			* @param {Object} e.list 新增的list对象
			*/
			'pushList',
			/**
			* 减少堆栈list时触发此事件
			* @event popList
			* @param {event} e  事件对象
			* @param {Object} e.list 减少的list对象
			*/
			'popList',
			/**
			* 手动触发改变选项时 触发此事件
			* @event itemChangeSelect
			* @param {event} e  事件对象
			* @param {Object} e.item 触发的选项对象
			* @param {Object} e.data 该选项上绑定的数据
			* @param {Number} e.index 该视图在视图管理器中的索引值
			*/
			'itemChangeSelect',
			/**
			* 通过视图的主动点击 从而改变视图的已选项时 触发此事件
			* @event changeSelectByClick
			* @param {event} e  事件对象
			* @param {Object} e.list 改变的视图对象
			* @param {Object} e.item 改变的数据项
			* @param {Number} e.index 视图在视图管理器中的索引值
			*/
			'changeSelectByClick',
			/**
			* 通过store对象触发 从而改变视图的已选项时 触发此事件
			* @event changeSelectByStore
			* @param {event} e  事件对象
			* @param {Object} e.list 改变的视图对象
			* @param {Object} e.item 改变的数据项
			*/
			'changeSelectByStore',
			/**
			* 视图管理器的视图路径更新时触发此事件 用于驱动视图的更新
			* @event pathUpdate
			* @param {event} e  事件对象
			* @param {Array} e.path 更新后的path
			*/
			'pathUpdate',
			/**
			* 发生变更时，触发（最后一个resultUpdate之后触发）
			* @event changed
			* @param {event} e  事件对象
			* @param {Array} e.path  更新后的path
			*/
			'changed'
		];
		_self._initView();
	}
	S.extend(View, Base);
	S.augment(View, {
		/**
		* 获取视图管理器
		* @method getListManager
		* @return {Object} 视图管理器对象
		*/
		getListManager: function(){
			return this.get('listManager');
		},
		/**
		* 根据id路径更新视图
		* @method updateListsByPath
		* @param {Array} path id路径
		*/
		updateListsByPath: function(path){
			var _self = this,
				store = _self.getStore();
			if(path){
				store.getViewsByPath(path);
			}
		},
		/**
		* 根据id更新视图
		* @method updateListsById
		* @param {Number|String} id 目标id
		*/
		updateListsById: function(id){
			var _self = this,
				store = _self.getStore();
			id = id || null;
			store.getViewsById(id);
		},

		/**
		* 清空所选
		* @method clearSelect
		*/
		clearSelect: function(){
			this.updateListsById();
		},
		/**
		* 根据当前结果、当前数据，重新渲染所有视图
		* @method reloadLists
		*/
		reloadLists: function(){
			var _self = this,
				store = _self.getStore(),
				path = _self.getPathFromResult();
			// 清空选择
			_self.clearSelect();
			// 重置基础视图
			store._popView();
			store._setBaseView();
			// 重新定位
			_self.updateListsByPath(path);
		},

		// 初始化store 重写该方法 实例化ViewStore
		_initStore: function(){
			var _self = this,
				store = _self.get('store'),
				storeConfig;
			if(!store){
				storeConfig = _self._getStoreConfig();
				store = new ViewStore(storeConfig);
			}
			_self.set('store', store);
		},

		// tree初始化
		_initView: function(){
			var _self = this;
			_self._initListManager();
			_self._initViewEvent();
			_self.storeLoad();
		},
		// 初始化事件 视图核心控制逻辑
		_initViewEvent: function(){
			var _self = this,
				store = _self.getStore();

			_self.on('loadTree', function(e){
			});

			_self.on('initData', function(e){
				store.getViewsByPath();
				_self.updateListsById(e.id);
			});

			store.on('popView', function(){
				_self._popList();
			});
			store.on('pushView', function(e){
				_self._pushList(e.view.list);
			});

			store.on('changeSelect', function(e){
				_self._changeSelectByStore(e.id);
			});

			store.on('searchView', function(e){
				_self._updataListForSearch(e.data, e.index, e.text);
			});

			_self.on('itemChangeSelect', function(e){
				_self._changeSelectByClick(e.item, e.index);
			});

			_self.on('changeSelectByClick', function(e){
				_self._getSelectedPath(e.index);
			});

			_self.on('pathUpdate', function(e){
				_self.updateListsByPath(e.path);
			});

			_self.on('changeSelectByStore', function(e){
				var _self = this;
				if(e.item){
					_self._pushResult(_self._getDataByItem(e.item));
				}else{
					_self._popResult();
				}
			});

			// 切换树的数据
			_self.on('beforeReload', function(){
				_self._destroyView();
			});

			_self.on('beforeDestroy', function(){
				_self._destroyView();
			});
			
			_self.on('resultUpdate', function(e){
				_self._viewChanged(e.result);
			});
			
		},
		// 视图改变后，触发changed事件
		_viewChanged: function(result){
			var _self = this,
				store = _self.getStore(),
				targetPath = store.get('targetPath'),
				currentPath = _self.getPathFromData(result) || [],
				toTarget = true;
			if(currentPath && targetPath.length === currentPath.length){
				S.each(targetPath, function(tId, i){
					if(tId !== currentPath[i]){
						toTarget = false;
						return false;
					}
				});
			}else{
				toTarget = false;
			}
			if(toTarget){
				_self.fire('changed', {path: targetPath});
			}	
		},

		// Tree视图控制功能
		// 视图逻辑控制层
		// 初始化视图管理器
		_initListManager: function(){
			var _self = this,
				listManager = {
					listPath: [],
					lists: []
				};
			_self.set('listManager', listManager);
		},
		// 增加视图
		_pushList: function(data){
			var _self = this,
				listManager = _self.getListManager(),
				newList = _self._initList(data, listManager.lists.length);
			listManager.lists.push(newList);
			_self.fire('pushList', {list: newList});
			return newList;
		},
		// 减少视图
		_popList: function(){
			var _self = this,
				listManager = _self.getListManager(),
				popList = listManager.lists.pop();
			_self._destroyList(popList);
			_self.fire('popList', {list: popList});
			return popList;
		},
		// 手动选择所触发的方法
		_itemChangeSelect: function(item){
			var _self = this,
				itemNodeData = _self._getDataByItem(item) || {};
			_self.fire('itemChangeSelect', {item: item, data: itemNodeData, index: itemNodeData.index});
		},
		// 获取当前所选的路径，触发视图的更新
		_getSelectedPath: function(index){
			var _self = this,
				listManager = _self.getListManager(),
				path = [];
			if(index === null || index === undefined){
				index = listManager.lists.length - 1;
			}
			S.each(listManager.lists, function(list, i){
				if(i > index){
					return false;
				}
				if(list.selectedId){
					path.push(list.selectedId);
				}
			});

			listManager.listPath = path;

			_self.fire('pathUpdate', {path: path});
		},
		// 视图内搜索功能
		_searchList: function(searchText, index){
			var _self = this,
				store = _self.getStore();
			store.searchView(searchText, index);
		},
		// 根据搜索结果更新视图
		_updataListForSearch: function(data, index, text){
			var _self = this,
				listManager = _self.getListManager(),
				list = listManager.lists[index],
				selectedId = list.selectedId;

			_self._destroyListItems(list);

			_self._initListItems(list, data, index, selectedId, text);
		},

		// 视图模板逻辑层
		// 根据点击更新选择的节点
		_changeSelectByClick: function(item, index){
			var _self = this,
				listManager = _self.getListManager(),
				changList = listManager.lists[index],
				adapterForNode = _self.getStore().get('adapterForNode');

			if(!_self._isItemSelect(item, changList)){
				_self._removeAllSelect(item, changList);
				_self._addItemSelect(item, changList);
			}

			_self._setListSelected(changList, item, _self._getDataByItem(item)[adapterForNode.id]);

			_self.fire('changeSelectByClick', {list: changList, item: item, index: index});
		},
		// 根据store 更新选择的节点
		_changeSelectByStore: function(id){
			var _self = this,
				listManager = _self.getListManager(),
				changList = listManager.lists[listManager.lists.length - 1],
				items = _self._getItems(changList),
				selectedItem = changList.selectedItem,
				selectedId = changList.selectedId,
				adapterForNode = _self.getStore().get('adapterForNode');

			if(!(id && selectedId && selectedId === id)){
				if(selectedItem){
					_self._removeItemSelect(selectedItem, changList);
				}
				if(id){
					S.each(items, function(item){
						item = S.one(item);
						if(_self._getDataByItem(item)[adapterForNode.id] === id){
							selectedItem = item;
							selectedId = id;
							return false;
						}
					});
					_self._addItemSelect(selectedItem, changList);
				}else{
					selectedItem = null;
					selectedId = null;
				}
				_self._setListSelected(changList, selectedItem, selectedId);
			}

			_self.fire('changeSelectByStore', {list: changList, item: selectedItem});

			return selectedItem;
		},
		// 设置视图管理器中的选中节点
		_setListSelected: function(list, item, id){
			list.selectedItem = item;
			list.selectedId = id;
		},
		// 判断该节点是否为选择
		_isItemSelect: function(item, list){},
		// 添加该节点的选中状态
		_addItemSelect: function(item, list){},
		// 移除该节点的选中状态
		_removeItemSelect: function(item, list){},
		// 移除该视图下所有节点的选中状态
		_removeAllSelect: function(item, list){},

		// 视图模板层
		// 初始化视图
		_initList: function(data, index){
			var _self = this,
				list = {},
				listConDom;

			if(data.length === 0){
				return {};
			}

			listConDom = _self._initListDom(list, index);

			_self._initListData(list, listConDom, index);

			_self._initListItems(list, data, index);

			_self._initListEvent(list);

			return list;
		},
		// 初始化视图数据
		_initListData: function(list, listDom, index){
			var _self = this;
			list.dom = listDom;
			list.index = index;
			_self._setListSelected(list, null, null);
		},
		// 初始化视图dom结构
		_initListDom: function(list, index){},
		// 初始化视图的事件
		_initListEvent: function(list){},

		// 初始化视图节点
		_initListItems: function(list, data, index, id, text){
			var _self = this,
				adapterForNode = _self.getStore().get('adapterForNode');
							
			S.each(data, function(node){
				// 过滤掉children属性
				var nodeData = _self.getStore().dataFilter(node),
					itemEl = _self._initListItemsDom(list, nodeData, index, id, text);

				if(id && id === nodeData[adapterForNode.id]){
					_self._addItemSelect(itemEl, list);
					_self._setListSelected(list, itemEl, id);
				}

				_self._initListItemsEvent(itemEl, list);
				_self._initListItemsData(itemEl, nodeData, index);
			});
		},
		// 初始化视图节点的数据
		_initListItemsData: function(itemEl, nodeData, index){
			nodeData.index = index;
			itemEl.data('nodeData', nodeData);
		},
		// 初始化视图节点的Dom结构
		_initListItemsDom: function(list, nodeData, index, id, text){},
		// 初始化视图节点的事件
		_initListItemsEvent: function(itemEl, list){},

		// 获取视图下所有节点的对象
		_getItems: function(list){},
		// 获取item上的数据
		_getDataByItem: function(item){
			return item.data('nodeData');
		},

		// 销毁视图
		_destroyList: function(list){
			var _self = this;
			if(!S.isEmptyObject(list)){
				_self._destroyListItems(list);
				list.dom.detach().remove();
				list = {};
			}
		},
		// 销毁视图节点
		_destroyListItems: function(list){
			var _self = this,
				items = _self._getItems(list);
			items.detach().remove();
		},
		// 销毁view对象
		_destroyView: function(){
			var _self = this,
				listManager = _self.getListManager(),
				store = _self.getStore();

			S.each(listManager.lists, function(list){
				_self._destroyList(list);
			});

			listManager.listPath = [];
			listManager.lists = [];

			store._destroyView();
		}

	});

	return View;

},{requires: ['./base', './viewstore']});




/**
* List 列表目录树
* @version 2.0
*/
KISSY.add('gallery/trees/1.0/list',function(S, View){
	var DOM = S.DOM,
		Event = S.Event;

	var CLS_LEFT_BTN = 'list-button-left',
		CLS_RIGHT_BTN = 'list-button-right',
		CLS_SEARCH_INPUT = 'list-search-input',
		CLS_SEARCH_TIP = 'list-search-tip',
		CLS_ITEM = 'list-i',
		CLS_ITEM_MORE = 'list-more',
		CLS_ITEM_SELECTED = 'list-selected',
		CLS_CON = 'list-inner-inner',
		CLS_BTN_ACTIVE = 'list-button-active',
		CLS_RESULT_CON = 'list-result-con',
		CLS_ITEM_CON = 'list-u',
		HTML_CON = ['<div class="list-container ks-clear">',
				'<div class="list-left">',
					'<s class="list-button list-button-left"></s>',
				'</div>',
				'<div class="list-inner">',
					'<div class="list-inner-inner">',
					'</div>',
				'</div>',
				'<div class="list-right">',
					'<s class="list-button list-button-right"></s>',
				'</div>',
			'</div>',
			'<div class="list-result tips tips-small tips-notice">',
				'<strong>您当前的选择: </strong>',
				'<span class="list-result-con"></span>',
			'</div>'].join(''),
		HTML_ITEM_CON = ['<div class="list-item">',
				'<div class="list-search">',
					'<input type="text" class="list-search-input"/>',
					'<p class="list-search-tip"></p>',
				'</div>',
				'<ul class="list-u">',
				'</ul>',
			'</div>'].join('');

	/**
	* List 列表目录树 基于Tree.View 提供树的视图功能，并支持视图内搜索及整树搜索
	* @class Trees.List
	* @module Trees
	* @author 桐人<wwwfuzheng@qq.com>
	* @extend Trees.View
	* @constructor List
	* @param {Object} config 配置项 请参照Tree.View的配置项
	*/
	function List(config){
		var _self = this;
		config = S.merge(List.config, config);
		List.superclass.constructor.call(_self, config);
		_self._initListTree();
	}
	List.config = {
		/**
		* 视图搜索框的提示文案 (选填)
		* @property searchTip
		* @type String
		*/
		searchTip: '',
		/**
		* 单个list宽度 (选填)
		* @property listWidth
		* @type Number
		*/
		listWidth: 215,
		/**
		* list的可视区域展示数量 (选填)
		* @property listNum
		* @type Number
		* @default 4
		*/
		listNum: 4
	};
	S.extend(List, View);
	S.augment(List, {
		// 初始化
		_initListTree: function(){
			var _self = this,
				container = _self.get('container'),
				listsCon,
				resultCon,
				leftBtn,
				rightBtn;

			container[0].innerHTML = HTML_CON;

			listsCon = S.one('.' + CLS_CON, container);
			resultCon = S.get('.' + CLS_RESULT_CON, container);

			leftBtn = S.one('.' + CLS_LEFT_BTN, container);
			rightBtn = S.one('.' + CLS_RIGHT_BTN, container);

			_self.set('listsCon', listsCon);
			_self.set('resultCon', resultCon);

			_self.set('leftBtn', leftBtn);
			_self.set('rightBtn', rightBtn);

			_self.set('containerWidth', _self.get('listWidth') * _self.get('listNum'));

			_self._initListTreeEvent();
		},
		// 初始化事件
		_initListTreeEvent: function(){
			var _self = this,
				container = _self.get('container'),
				leftBtn = _self.get('leftBtn'),
				rightBtn = _self.get('rightBtn');
			// 结果集变更时 更新结果显示区
			_self.on('resultUpdate', function(e){
				_self._updateResultCon();
			});
			// 向左滚动事件
			leftBtn.on('click', function(){
				if(DOM.hasClass(this, CLS_BTN_ACTIVE)){
					_self._roll('left');
				}
			});
			// 向右滚动事件
			rightBtn.on('click', function(){
				if(DOM.hasClass(this, CLS_BTN_ACTIVE)){
					_self._roll('right');
				}
			});
			// 视图更新时更新滚动状态
			_self.on('pushList popList', function(){
				_self._resetListConWidth();
				_self._rollManage(function(){
					if(_self._isRoll()){
						_self._roll('last');
					}
				});
			});
			// 加入自己的销毁逻辑
			_self.on('beforeDestroy', function(){
				_self._destroyListTree();
			});
		},
		// 重写 - 初始化视图dom
		_initListDom: function(list, index){
			var _self = this,
				listConDom = DOM.create(HTML_ITEM_CON),
				listsCon = _self.get('listsCon');

			listsCon.append(listConDom);

			list.itemsCon = S.one('.' + CLS_ITEM_CON, listConDom);
			list.searchInput = S.one('.' + CLS_SEARCH_INPUT, listConDom);
			list.searchTip = S.one('.' + CLS_SEARCH_TIP, listConDom);

			list.searchInput.data('index', index);
			list.searchTip.text(_self.get('searchTip'));

			return S.one(listConDom);
		},
		// 重写 - 初始化视图事件
		_initListEvent: function(list){
			var _self = this,
				searchTimer;
			// 搜索框提示
			list.searchTip.on('click', function(){
				S.one(this).hide().prev()[0].focus();
			});
			list.searchInput.on('focus', function(){
				S.one(this).next('.' + CLS_SEARCH_TIP).hide();
			});
			list.searchInput.on('blur', function(){
				var i = S.one(this),
					tip = i.next('.' + CLS_SEARCH_TIP);
				if(!!i.val()){
					tip.hide();
				}else{
					tip.show();
				}
			});
			// 自动搜索
			list.searchInput.on('keyup', function(e){
				if(e.which === 32 || e.which === 8 || e.which === 46 || (e.which >= 65 && e.which <= 90) || (e.which >= 48 && e.which <= 57) || (e.which >= 96 && e.which <= 105)){
					var input = S.one(this);
					if(searchTimer){
						searchTimer.cancel();
					}
					searchTimer = S.later(function(){
						_self._searchList(input.val(), input.data('index'));
					}, 200);
				}
			});
			// 屏蔽回车事件
			list.searchInput.on('keydown', function(e){
				if(e.which === 13){
					return false;
				}
			});
		},
		// 重写 - 初始化视图节点dom
		_initListItemsDom: function(list, nodeData, index, id, text){
			var _self = this,
				itemCls = CLS_ITEM,
				itemStr,
				itemEl,
				_data = S.clone(nodeData),
				adapterForNode = _self.getStore().get('adapterForNode');

			if(!nodeData[adapterForNode.isleaf]){
				itemCls += (' ' + CLS_ITEM_MORE);
			}

			if(text){
				_data[adapterForNode.value] = _data[adapterForNode.value].replace(text, '<s>' + text + '</s>');
			}

			itemStr = ['<li class="', itemCls, '">',
				_self._getContent(_data),
				'</li>'
			].join('');

			itemEl = DOM.create(itemStr);
			list.itemsCon.append(itemEl);
			itemEl = S.one(itemEl);

			return itemEl;
		},
		// 重写 - 初始化视图节点事件
		_initListItemsEvent: function(itemEl){
			var _self = this;
			itemEl.on('click', function(){
				var item = S.one(this);
				if(!_self._isItemSelect(item)){
					_self._itemChangeSelect(S.one(this));
				}
			});
		},
		// 重写 - 获取视图节点
		_getItems: function(list){
			return S.all('.' + CLS_ITEM, list.dom);
		},
		// 重写 - 判断节点是否选中
		_isItemSelect: function(item){
			return item.hasClass(CLS_ITEM_SELECTED);
		},
		// 重写 - 添加节点选中状态
		_addItemSelect: function(item, list){
			var itemTop = item.offset().top - list.itemsCon.offset().top,
				conHeight = list.itemsCon.height();			
			item.addClass(CLS_ITEM_SELECTED);
			// 滚动到选中元素，使选中元素在可视区域显示
			if(itemTop < 0 || itemTop > conHeight){
				DOM.scrollIntoView(item, list.itemsCon, false, false);			
			}
		},
		// 重写 - 移除节点选中状态
		_removeItemSelect: function(item){
			item.removeClass(CLS_ITEM_SELECTED);
		},
		// 重写 - 移除所有节点选中状态
		_removeAllSelect: function(item, list){
			var _self = this,
				items = _self._getItems(list);
			items.removeClass(CLS_ITEM_SELECTED);
		},
		// 更新结果到结果窗口
		_updateResultCon: function(){
			var _self = this;
			_self.get('resultCon').innerHTML = _self.getValueStrFromResult();
		},
		// 滚动窗口
		_roll: function(rollType){
			var _self = this,
				listsCon = _self.get('listsCon'),
				listWidth = _self.get('listWidth'),
				listConWidth = _self.get('listConWidth'),
				containerWidth = _self.get('containerWidth'),
				listsConLeft = listsCon.css('left').replace('px', '') * 1 || 0;
			// 滚动核心
			var __roll = function(target, distance){
				/* target = 1 => roll right
				   target = -1 => roll left */
				var targetPos = listsConLeft + target * distance;
				targetPos = targetPos > 0 ? 0 :
					containerWidth - listConWidth - targetPos > 0 ? containerWidth - listConWidth : targetPos;

				_self._rollAnim(targetPos, function(){
					_self._resetRollBtn();
				}).run();
			};

			if(rollType === 'left'){
				__roll(1, listWidth);
			}else if(rollType === 'right'){
				__roll(-1, listWidth);
			}else if(rollType === 'last'){
				__roll(1, containerWidth - listsConLeft - listConWidth);
			}else if(rollType.target && rollType.distance){
				__roll(rollType.target, rollType.distance);
			}
		},
		// 延时滚动管理
		_rollManage: function(func){
			var _self = this,
				rollTimer = _self.get('rollTimer');

			if(rollTimer){
				rollTimer.cancel();
			}
			rollTimer = S.later(func, 200);

			_self.set('rollTimer', rollTimer);
		},
		// 滚动动画
		_rollAnim: function(targetPos, func){
			var _self = this;
			return S.Anim(_self.get('listsCon'), {'left': targetPos + 'px'}, 0.2, 'easeOut', func);
		},
		// 重置当前listsCon容器宽度
		_resetListConWidth: function(){
			var _self = this,
				listsCon = _self.get('listsCon'),
				listWidth = _self.get('listWidth'),
				_width = listsCon.children().length * listWidth;

			listsCon.width(_width + 'px');
			_self.set('listConWidth', _width);
			return _self;
		},
		// 重置button状态
		_resetRollBtn: function(){
			var _self = this,
				listsCon = _self.get('listsCon'),
				listConWidth = _self.get('listConWidth'),
				containerWidth = _self.get('containerWidth'),
				listsConLeft = listsCon.css('left').replace('px', '') * 1 || 0,
				rightBtn = _self.get('rightBtn'),
				leftBtn = _self.get('leftBtn');

			if(listConWidth + listsConLeft - containerWidth > 0){
				rightBtn.addClass(CLS_BTN_ACTIVE);
			}else{
				rightBtn.removeClass(CLS_BTN_ACTIVE);
			}
			if(listsConLeft < 0){
				leftBtn.addClass(CLS_BTN_ACTIVE);
			}else{
				leftBtn.removeClass(CLS_BTN_ACTIVE);
			}
		},
		// 判断是否需要滚动
		_isRoll: function(){
			var _self = this,
				listsCon = _self.get('listsCon'),
				listConWidth = _self.get('listConWidth'),
				containerWidth = _self.get('containerWidth'),
				listsConLeft = listsCon.css('left').replace('px', '') * 1 || 0;
			_self._resetRollBtn();
			if(containerWidth - listsConLeft - listConWidth !== 0){
				return true;
			}
			return false;
		},
		// listTree自己的destroy
		_destroyListTree: function(){
			var _self = this,
				leftBtn = _self.get('leftBtn'),
				rightBtn = _self.get('rightBtn');
			leftBtn.detach().remove();
			rightBtn.detach().remove();
		}

	});

	return List;

},{requires: ['./view', './list.css']});




/** 
* Select 多级联动框
* @version 2.0
*/
KISSY.add('gallery/trees/1.0/select',function(S, View){

	var DOM = S.DOM,
		Event = S.Event;

	/** 
	* Select 多级联动框 基于Tree.View 的多级联动框
	* @class Trees.Select
	* @module Trees 
	* @author 桐人<wwwfuzheng@qq.com>
	* @extend Trees.View
	* @constructor Select
	* @param {Object} config 配置项 请参照Tree.View的配置项
	*/
	function Select(config){
		var _self = this;
		config = S.merge(Select.config, config);
		Select.superclass.constructor.call(_self, config);
		_self._initSelectTree();
	}
	Select.config = { 
		/**
		* 形成select的模版，
		* @property selectTpl
		* @type String
		* @default '<select></select>'
		*/
		selectTpl : '<select></select>',
		/**
		* select元素的class (选填)
		* @property selectCls
		* @type String
		*/
		selectCls: ''
	};
	S.extend(Select, View);
	S.augment(Select, {
		// 初始化
		_initSelectTree: function(){
			var _self = this;
			_self._initSelectTreeEvent();
		},
		// 初始化事件
		_initSelectTreeEvent: function(){},

		// 重写 - 初始化视图
		_initList: function(data, index){
			var _self = this,
				list = {},
				listConDom;

			if(data.length === 0){
				return {};
			}
			listConDom = _self._initListDom(list, index);
			_self._initListData(list, listConDom, index);

			// 加入selectTree逻辑
			var nullOptionData = {
					id: null,
					value: '请选择...'					
				},
				nullOption = _self._initListItemsDom(list, nullOptionData);
			_self._initListItemsData(nullOption, nullOptionData, index);
			// 加入selectTree逻辑 - end


			_self._initListItems(list, data, index);
			_self._initListEvent(list);

			// 加入selectTree逻辑
			if(!list.selectedItem){
				_self._getItems(list)[0].selected = true;
			}
			// 加入selectTree逻辑 - end

			return list;
		},		
		// 重写 - 初始化视图dom
		_initListDom: function(list, index){
			var _self = this,
				el = null,
				selectDom = null,
				container = _self.get('container');

			el = new S.Node(_self.get('selectTpl')).appendTo(container);
			selectDom = _self._getSelect(el);
			selectDom.addClass( _self.get('selectCls'));

			return el;
		},
		// 重写 - 初始化视图事件
		_initListEvent: function(list){
			var _self = this;

			_self._getSelect(list.dom).on('change', function(){
				var selectOption = this.options[this.selectedIndex];
				_self._itemChangeSelect(S.one(selectOption));
			});
		},
		// 重写 - 初始化视图节点dom
		_initListItemsDom: function(list, nodeData){
			var _self = this,
				optionStr,
				optionEl,
				adapterForNode = _self.getStore().get('adapterForNode');

			optionStr = ['<option value="', nodeData[adapterForNode.id], '" title="', nodeData[adapterForNode.value], '">',
				nodeData[adapterForNode.value],
				'</option>'
			].join('');

			optionEl = DOM.create(optionStr);
			//提供模版之后，list.dom不一定是select
			_self._getSelect(list.dom).append(optionEl);
			optionEl = S.one(optionEl);

			return optionEl;
		},
		// 重写 - 获取视图节点
		_getItems: function(list){
			return S.all('option', list.dom);//
		},
		_getSelect : function(dom){
			dom = S.one(dom);
			if(dom){
				if(dom[0].tagName.toUpperCase() === 'SELECT'){
					return dom;
				}else{
					return dom.one('select');
				}
			}
		},
		// 重写 - 判断节点是否选中
		_isItemSelect: function(item){
			return item[0].selected;
		},
		// 重写 - 添加节点选中状态
		_addItemSelect: function(item){
			item[0].selected = true;
		},
		// 重写 - 移除节点选中状态
		_removeItemSelect: function(item){
			item[0].selected = false;	
		},
		// 重写 - 移除所有节点选中状态
		_removeAllSelect: function(item){
			S.each(item.siblings(), function(o){
				item[0].selected = false;
			});
		}

	});

	return Select;

},{requires: ['./view']});




/** 
* City 省市联动选择框
* @version 2.0
*/
KISSY.add('gallery/trees/1.0/city',function(S, Select){
	var DOM = S.DOM,
		Event = S.Event;

	var P_C_DATA = 'http://lp.taobao.com/go/rgn/provincecitydata.php',		// 省市联动
		C_D_DATA = 'http://lp.taobao.com/go/rgn/citydistrictdata.php',		// 省市区联动
		P_C_SIMPLE_DATA = 'http://lp.taobao.com/go/rgn/provincecitydata-simple.php';	// 省市联动-简单版

	/**
	* City 省市联动选择框 基于Tree.Select
	* @class Trees.City
	* @module Trees 
	* @author 桐人<wwwfuzheng@qq.com>
	* @extend Trees.Select
	* @constructor City
	* @param {Object} config 配置项 请参照Tree.View 及 Tree.Select的配置项
	*/
	function City(config){
		var _self = this;
		config = S.merge(City.config, config);
		City.superclass.constructor.call(_self, config);
	}
	City.config = {
		/**
		* 结果类型 默认为 'path'
		* @property resultType
		* @type String
		* @default 'path'
		*/
		resultType: 'path',
		/**
		* 城市数据类型 0 代表 省市数据;  1 代表 省市区 数据;  2 代表 省市区-简单版 数据;
		* @property cityType
		* @type String
		* @default 0 省市数据
		*/
		cityType: 0
	};
	S.extend(City, Select);
	S.augment(City, {
		// 重写 定制化url
		_getStoreUrl: function(){
			var _self = this,
				cityType = _self.get('cityType'),
				url = _self.get('url');
			if(!url){
				switch(cityType){
					case 0:
						url = P_C_DATA;
						break;
					case 1:
						url = C_D_DATA;
						break;
					case 2:
						url = P_C_SIMPLE_DATA;
						break;
				}
				_self.set('url', url);
				_self.set('isJsonp', true);
			}
			return url;
		}
	});

	return City;

},{requires: ['./select']});




/**
 * Tree组件入口文件
 * @fileoverview 
 * @author 桐人<wwwfuzheng@qq.com>
 * @module trees
 **/
KISSY.add('gallery/trees/1.0/index',function(S, Store, Base, Tree, ViewStore, View, List, Select, City){
	/**
	* Trees组件入口类
	*/
	var Trees = {};
	Trees.Store = Store;
	Trees.Base = Base;
	Trees.Tree = Tree;
	Trees.ViewStore = ViewStore;
	Trees.View = View;
	Trees.List= List;
	Trees.Select = Select;
	Trees.City = City;

	return Trees;

}, {requires: ["./store", "./base", "./tree", "./viewstore", "./view", "./list", "./select", "./city"]});


