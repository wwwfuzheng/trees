/**
* List 列表目录树
* @version 2.0
*/
KISSY.add(function(S, View){
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



