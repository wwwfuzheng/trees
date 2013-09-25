/** 
* Tree 普通树 支持多选
* @version 1.0
* @date: 2013-05-3
*/
KISSY.add(function(S, STree, Base){
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

