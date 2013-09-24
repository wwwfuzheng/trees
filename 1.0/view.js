/**
* View 视图功能的Tree
* @version 2.0
*/
KISSY.add(function(S, Base, ViewStore){

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



