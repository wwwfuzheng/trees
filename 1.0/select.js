/** 
* Select 多级联动框
* @version 2.0
*/
KISSY.add(function(S, View){

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



