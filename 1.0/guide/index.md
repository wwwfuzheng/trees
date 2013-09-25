## 综述

Trees - 树形数据管理与展现

* 版本：1.0
* 作者：桐人
* demo：[http://gallery.kissyui.com/trees/1.0/demo/index.html](http://gallery.kissyui.com/trees/1.0/demo/index.html)

### 组件结构

	Tree
		|- Base			树的基类
		|- Store		树形数据缓冲对象
		|- ViewStore	视图树数据缓冲对象 继承于 Trees.Store
		|- View			视图树基类 继承于 Trees.Base
		|- List			列表树 继承于 Trees.View
        |- SearchSelect	带搜索的多级联动下拉框 继承于 Trees.View
		|- Select		多级联动下拉框 继承于 Trees.View
		|- City			城市联动框 继承于 Trees.Select
		|- Tree			标准树 继承于 Trees.Base & KISSY.Tree


## 初始化组件

	S.use('gallery/trees/1.0/index', function (S, Trees) {
    	var list = new Trees.List(),
         	select = new Trees.Select(),
         	city = new Trees.city();
    });


## Trees.Store

* 模块名：`gallery/trees/1.0/store`
* 所有树形数据均可以用本模块来处理。
* 本模块提供了**数据加载**、**数据遍历**等基础功能

### config 属性配置

#### url - String

* 数据异步读取url（选填，不填的话可以手动设置树的数据）
* Default: `''`

#### param - Object

* 数据读取的初始化参数，与 url 配合适用（选填）
* Default: `{}`

#### data - Array

* 给store初始化用的数据
* Default: `[]`

#### idKey - String

* 节点数据中，id的key（选填, 不填的话默认是 adapterForNode.id）
* Default: `adapterForNode.id`

#### isJsonp - Boolean

* 是否用jsonp形式发送请求
* Default: `false`

#### autoLoad - Boolean

* 数据是否自动加载（选填）
* Default: `false`

#### requestType - String

* 异步请求方式('get'/'post')，在jsonp方式下，不起作用，固定为get
* Default: `'get'`

#### dataErrorFunc - Function

* 当数据加载失败的回调方法（选填）
* Default: `alert(msg);`

#### adapterForData - Object

* 数据的适配器（选填）
* Default: `{ success: 'success', nodes: 'nodes', message: 'message' }`

#### adapterForNode - Object

* node数据的适配器（选填）
* Default: `{ id: 'id', value: 'value', children: 'children', parent: 'parent', isleaf: 'isleaf' }`


### 支持的方法

#### getChildrenByNode(node)

* 获取节点的子节点列表
* `node` - Object - 目标节点
* Returns: (Array)  子节点列表  

#### getChildrenById(id)

* 通过id 获取子节点列表
* `id` - String|Number - 目标id。 若没有，则返回[]
* Returns: (Array)  子节点列表  

#### getChildrenByPath(path)

* 通过Path 获取子节点列表
* `path` - Array - 目标path。 若没有，则返回 treeData
* Returns: (Array)  子节点列表  

#### getNodeById(id)

* 通过id 获取节点对象
* `id` - String|Number - 目标id。 若没有，则返回空值
* Returns: (Object)  节点对象   

#### getNodeByPath(path)

* 通过Path 获取节点对象
* `path` - Array - 目标path。 若没有，则返回空值
* Returns: (Object)  节点对象   

#### getLeafsById(id)

* 根据id 获取节点的全部叶子节点
* `id` - String|Number - 目标节点Id
* Returns: (Array)  叶子节点路径列表（pathNade）, 路径内不带当前节点，节点数据不带children属性   

#### getLeafsByNode(node)

* 根据节点 获取节点的全部叶子节点
* `node` - Object - 目标节点
* Returns: (Array)  叶子节点路径列表（pathNade）, 路径内不带当前节点，节点数据不带children属性 

#### getParentById(id)

* 通过id 获取该节点的父节点对象
* `id` - String|Number - 目标节点Id
* Returns: (Object)  父节点对象  

#### getPathById(id)

* 通过id 获取节点路径
* `id` - String|Number - 目标id。 若没有，则返回[]
* Returns: (Array)  节点路径   

#### getTreeByLevel(level)

* 获取特定层级的树
* `level` - Number - 目标层级 跟节点为0级，若获取根目录，则 level = 1
* Returns: (Array)  过滤后获取的数据    

#### getTreeData()

* 获取树的数据
* Returns: (Array) 树数据     

#### setTreeData(nodeData, [id])

* 手动填充树的数据 此方法会触发load事件
* `nodeData` - Array - 带填充的节点列表
* `id` - String|Number - 需要填充的节点id, (选填，若不填则当作整个树数据填充)

#### searchTree(searchText)

* 通过文本搜索树 此方法会触发searchTree事件
* `searchText` - String - 要搜索的文本
* Returns: (Object)  搜索结果     

#### traverseTreeById(id)

* 遍历树，通过id搜索节点
* `id` - String|Number - 目标id。 若没有，则返回的皆为空值
* Returns: (Object)  

```
	obj.path => 该节点的路径id 
	obj.valuePath => 该节点的路经value 
	obj.pathNode => 该节点的路经node 
	obj.node => 该节点对象    
```

#### traverseTreeByText(text)

* 遍历树，通过text搜索节点列表
* `text` - String - 目标文本。 若没有，则返回的皆为空值
* Returns: (Object)   obj.pathList => 路径id列表 obj.valuePathList => 路径value列表 obj.pathNodeList => 路径node列表，节点数据不带children属性 

```
	obj.pathList => 路径id列表 
	obj.valuePathList => 路径value列表 
	obj.pathNodeList => 路径node列表，节点数据不带children属性 
```

#### load([param], [url], [func], [isTreeData])

* 加载树数据 此方法会触发load事件
* `param` - Object|String - 参数对象 或 需要加载的id (不填则取默认的参数对象，若是String，则会用idKey配置参数对象)
* `url` - String - 加载数据的url （选填，没有则取默认的url）
* `func` - Function - 加载完成时需要回调的方法 （选填）
* `isTreeData` - Boolean - 是否加载整树数据 （选填，默认为false）

#### initLoad()

* 初始化加载store

#### isTreeReady([node], [func])

* 检查树的数据是否加载完成
* `node` - Object - 要检查的节点对象 （选填，不填则检查整个树对象）
* `func` - Function - 若没有完成时，加载数据是需要回调的方法 （选填）
* Returns: (Boolean)  是否准备完成      

#### dataFilter(data)

* 将节点中的children属性过滤掉
* `data` -  Array|Object - 需要过滤的数据: 节点 或节点列表
* Returns: (Array|Object)   过滤后的数据       

#### destroy()

* 销毁对象


### 支持的事件

#### load

* 数据加载完成时 触发此事件（load/setTreeData 都会触发)
* `e.data` - 加载的数据
* `e.id` - 所在节点的id
* `e.param` - 加载的参数（setTreeData触发时没有此属性）

#### searchTree

* 通过text遍历搜索树后 触发此事件
* `e.text` - 搜索的文本值
* `e.pathList` - 搜索的路径id集合
* `e.valuePathList` - 搜索的路径value集合
* `e.result` - 搜索结果


## Trees.Base

* 模块名：`gallery/trees/1.0/base`
* 本模块提供了**数据初始化**、**结果管理**等组件基础功能。

### config 属性配置

#### renderTo - String

* 树渲染dom的容器ID (必填)

#### resultId - String

* 存储选择结果的容器Id（选填, 没有则不写入结果）
* Default: `''`

#### url - String

* 这里是 storeConfig.url 的简写形式，用于数据异步读取url（选填，不填的话可以手动设置树的数据）
* Default: `''`

#### param - Object

* 这里是 storeConfig.param 的简写形式，用于数据读取的初始化参数，与 url 配合使用（选填）
* Default: `{}`

#### data - Array

* 这里是 storeConfig.data 的简写形式，在不配置url的时候，可以用来直接配置数据（选填）
* Default: `[]`

#### idKey - String

* 这里是 storeConfig.idKey 的简写形式，用于标识节点数据中，id的key（选填, 不填的话默认是 adapterForNode.id）
* Default: `adapterForNode.id`

#### isJsonp - Boolean

* 这里是 storeConfig.isJsonp 的简写形式，用于选择是否用jsonp形式发送请求
* Default: `false`

#### storeConfig - Object

* 在这里进行store的配置，具体配置项请参见Trees.Sore（选填）
* Default: `{}`

#### store - Object

* 可以直接传入store对象（选填）
* Default: `null`

#### resultType - String

* 获取结果的类型 可选填的值有：'result', 'id', 'value', 'path', 'valuePath', 'valueStr' 可以组合多个类型的值 用**空格**隔开 
* 注意：只有'result', 'id', 'path'三种类型支持回显
* Default: `'result'`

#### contentTemplate - String

* 节点文案显示模板(KISSY.XTemplate)，默认只显示value
* Default: `''`


### 支持的方法

#### getResultManage()

* 获取结果对象 结果管理器中可以存放单结果，也可以存放多结果，根据不同树的使用场景不同 而下面的取结果方法，都可以正确的取到结果，一个值或是数组
* Returns: (Array)  结果集列表  

#### getIdFromResult()

* 获取选中结果的ID
* Returns: (Number|String|Array) 选中结果的ID 

#### getIdFromData(data)

* 从数据中，获取ID
* `data` - Array - 类似结果管理器的数据，为null,则直接取结果管理器
* Returns: (Number|String|Array) 选中结果的ID 

#### getIdFormResultInput()

* 从存储结果的input中获取id, 根据 resultType
* `data` - Array - 类似结果管理器的数据，为null,则直接取结果管理器
* Returns: (Number|String|Array) 获取的ID 

#### getPathFromResult()

* 获取结果的ID路径
* Returns: (Array) ID路径  

#### getPathFromData(data)

* 从数据中，获取ID路径
* `data` - Array - 类似结果管理器的数据，为null,则直接取结果管理器
* Returns: (Array) ID路径  

#### getValueFromResult()

* 获取选中结果的velue
* Returns: (String|Array) 选中结果的velue   

#### getValueFromData(data)

* 从数据中，获取velue
* `data` - Array - 类似结果管理器的数据，为null,则直接取结果管理器
* Returns: (String|Array) 选中结果的velue   

#### getValuePathFromResult()

* 获取结果的value路径
* Returns: (Array) value路径 

#### getValuePathFromData(data)

* 从数据中，获取value路径
* `data` - Array - 类似结果管理器的数据，为null,则直接取结果管理器
* Returns: (Array) value路径   

#### getValueStrFromResult(joinStr)

* 获取结果的value路径字符串形式
* `joinStr` - String - 连接符(选填)，默认为 ' > '
* Returns: (String|Array) value路径字符串形式 

#### getValueStrFromData(data, joinStr)

* 从数据中，获取value路径字符串形式
* `data` - Array - 类似结果管理器的数据，为null,则直接取结果管理器
* `joinStr` - String - 连接符(选填)，默认为 ' > '
* Returns: (String|Array) value路径字符串形式 

#### getAllLeafsFromResult()

* 从结果管理器中，获取所有叶子节点列表
* Returns: (Array) 所有叶子节点的节点路径 

#### getAllLeafsFromData(data)

* 从数据中，获取所有叶子节点列表
* `data` - Array - 类似结果管理器的数据，为null,则直接取结果管理器
* Returns: (Array) 所有叶子节点的节点路径  

#### isBlankResult([data])

* 判断当前结果集是否为空
* `data` - Array - 类似结果管理器的数据(选填)，为null,则直接取结果管理器
* Returns: (Boolean) 是否为空   

#### isLeafResult([data])

* 判断当前结果是不是叶子节点 如果是多结果，则只有全都是叶子节点 才返回true
* `data` - Array - 类似结果管理器的数据(选填)，为null,则直接取结果管理器
* Returns: (Boolean) 是否是叶子节点 若结果集为空，也会返回false 

#### isMultipleResult([data])

* 判断结果是否为多结果
* `data` - Array - 类似结果管理器的数据(选填)，为null,则直接取结果管理器
* Returns: (Boolean) 是否为多结果

#### traverseResul(func, [data])

* 多结果管理功能 遍历结果管理器
* `data` - Array - 类似结果管理器的数据(选填)，为null,则直接取结果管理器
* `func` - Function - 需要执行的方法 参数为单结果对象
* Returns: (String|Array) 处理之后的数据 

#### getStore(data)

* 获取Trees.Store对象
* Returns: (Object) Trees.Store对象

#### reload(param)

* 调用store的load方法，重新载入整树数据
* `param` - Object - 参数对象

#### searchTree(searchText)

* 调用store的searchTree方法，通过文本搜索树 此方法会触发searchTree事件
* `searchText` - String - 要搜索的文本
* Returns: (Object)  搜索结果

#### storeLoad([param])

* 调用store的searchTree方法，通过文本搜索树 此方法会触发searchTree事件
* `param` - Object|String|Array - 参数对象 或 需要加载的id (不填则取默认的参数对象，若是String，则会用idKey配置参数对象) 或想设置的数据

#### initData([param])

* 根据resultInput的值 初始化数据 触发 initData 事件
* Returns: (Number|String|Array)  需要初始化的id 或 id列表

#### destroy()

* 销毁Trees.Base对象


### 支持的事件

#### load

* 代理Trees.Store的load事件，树的数据加载完成后，触发此事件
* `e.data` - 加载的数据
* `e.id` - 父节点id
* `e.param` - 加载参数

#### loadTree

* tree载入，在数据load结束后，数据初始化之前触发

#### initData

* 数据初始化，在数据load结束后，并且tree载入完成时触发
* `e.id` - 需要初始化的节点id或id列表

#### loadFinished

* 树全部加载完成后触发
* load系列事件触发顺序： `(beforeReload ->) load -> loadTree -> initData -> loadFinished`

#### beforeReload

* 重新载入树数据，在载入之前触发

#### resultPop

* 弹出结果集堆栈时触发该事件
* `e.resultObj` - 弹出的结果对象
* `e.result` - 当前结果集

#### resultPush

* 压入结果集堆栈时触发该事件
* `e.resultObj` - 新增的结果对象
* `e.result` - 当前结果集

#### resultUpdate

* 结果集更新是时触发该事件， resultPop 和 resultPush 都会触发
* `e.result` - 当前结果集

#### searchTree

* 代理Trees.Store的searchTree事件 通过text遍历搜索树后 触发此事件
* `e.text` - 搜索的文本值
* `e.pathList` - 搜索的路径id集合
* `e.valuePathList` - 搜索的路径value集合
* `e.result` - 搜索结果

#### beforeDestroy

* 在销毁对象前 触发此事件



### 使用技巧

#### 数据回显

* 需要将 `resultType` 所配置的结果，回写到 resultInput 中，即可回显结果

```
	// resultType: 'id'
	<input type="hidden" id="J_ListTreeResult" value='{"id":291}'/>
```


## Trees.ViewStore

* 模块名：`gallery/trees/1.0/viewstore`
* 本模块提供了**数据模块视图功能**，供需要视图功能的树使用。
* 继承了 Trees.Store，拥有 Trees.Store 所有属性、事件、方法


### 支持方法

#### getViewManager()

* 获取视图管理器
* Returns: (Object)  视图管理器 

#### getViewIndex(view)

* 通过view对象，获取视图的索引
* `view` - Object - 视图对象
* Returns: (Number)  视图的索引  

#### getViewsById(id)

* 通过id设置视图列表
* `id` - String|Number - 选填，若没有则至返回一级菜单的视图
* Returns: (Object)  视图管理器  

#### getViewsByPath(path)

* 通过path设置视图列表
* `path` - Array - 选填，若没有则只返回一级菜单的视图
* Returns: (Object)  视图管理器  

#### searchView(searchText, index)

* 通过文本搜索视图 此方法会触发searchView事件
* `searchText` - String - 要搜索的文本
* `index` - Number - 要搜索的视图索引
* Returns: (Array)  搜索结果节点数据列表



### 支持事件

#### popView

* 弹出视图堆栈时 触发此事件
* `e.view` - 弹出堆栈的视图

#### pushView

* 压入视图堆栈时 触发此事件
* `e.view` - 压入堆栈的视图

#### popPath

* 弹出路径堆栈时 触发此事件
* `e.id` - 弹出堆栈的id
* `e.path` - 弹出后路径

#### pushPath

* 压入路径堆栈时 触发此事件
* `e.id` - 压入堆栈的id
* `e.path` - 压入后路径

#### changeSelect

* 视图选中项改变时 触发此事件
* `e.id` - 视图对象
* `e.view` - 选中的节点id

#### searchView

* 通过text遍历视图搜索后 触发此事件
* `e.text` - 搜索的文本值
* `e.data` - 搜索结果
* `e.index` - 搜索的视图在视图列表里的索引值



## Trees.View

* 模块名：`gallery/trees/1.0/view`
* 本模块提供了**视图功能树**的基本功能。
* 继承了 Trees.Base，拥有 Trees.Base 所有属性、事件、方法


### 支持方法

#### getListManager()

* 获取视图管理器
* Returns: (Object)  视图管理器对象 

#### updateListsById(id)

* 根据id更新视图
* `id` - String|Number - 目标id

#### updateListsByPath(path)

* 根据id路径更新视图
* `path` - Array - id路径

#### clearSelect()

* 清空所选

#### reloadLists()

* 根据当前结果、当前数据，重新渲染所有视图


### 支持事件

#### popList

* 弹出list堆栈时触发此事件
* `e.list` - 弹出的list对象

#### pushList

* 压入list堆栈时触发此事件
* `e.list` - 压入的list对象

#### changeSelectByClick

* 通过视图的主动点击 从而改变视图的已选项时 触发此事件
* `e.list` - 改变的视图对象
* `e.item` - 改变的数据项
* `e.index` - 视图在视图管理器中的索引值

#### changeSelectByStore

* 通过store对象触发 从而改变视图的已选项时 触发此事件
* `e.list` - 改变的视图对象
* `e.item` - 改变的数据项

#### itemChangeSelect

* 手动触发改变选项时 触发此事件
* `e.item` - 触发的选项对象
* `e.data` - 该选项上绑定的数据
* `e.index` - 该视图在视图管理器中的索引值

#### pathUpdate

* 视图管理器的视图路径更新时触发此事件 用于驱动视图的更新
* `e.path` - 更新后的path

#### changed

* 发生变更时，触发（最后一个resultUpdate之后触发）
* `e.path` - 更新后的path



## Trees.List

* 模块名：`gallery/trees/1.0/list`
* 本模块提供了**多级列表选择框**。
* 继承了 Trees.View，拥有 Trees.View 所有属性、事件、方法

### config 属性配置

#### listNum - Number

* list的可视区域展示数量 (选填)
* Default: `4`

#### listWidth - Number

* 单个list宽度 (选填)
* Default: `215`

#### searchTip - String

* 视图搜索框的提示文案 (选填)
* Default: `''`


### DOM结构

    <div id="J_ListTree"></div>
    <input type="hidden" id="J_ListTreeResult"/>

### 初始化

	S.use('gallery/trees/1.0/list', function (S, List) {
		new List({
			renderTo: 'J_ListTree',
			resultId: 'J_ListTreeResult',
			url: 'data.html',
			searchTip: '关键字',
			resultType: 'id'
		});	
    });


## Trees.Select

* 模块名：`gallery/trees/1.0/select`
* 本模块提供了**多级联动下拉选择框**。
* 继承了 Trees.View，拥有 Trees.View 所有属性、事件、方法


### config 属性配置

#### selectCls - String

* select元素的class (选填)
* Default: `''`

#### selectTpl - String

* 形成select的模版 (选填)
* Default: `'<select></select>'`


### DOM结构

    <div id="J_SelectTree"></div>
    <input type="hidden" id="J_SelectTreeResult"/>

### 初始化

	S.use('gallery/trees/1.0/select', function (S, Select) {
		new Select({
			renderTo: 'J_SelectTree',
			resultId: 'J_SelectTreeResult',
			url: 'data.html',
			resultType: 'id'
		});
    });


## Trees.City

* 模块名：`gallery/trees/1.0/city`
* 本模块提供了**城市联动框**。
* 继承了 Trees.Select，拥有 Trees.Select 所有属性、事件、方法


### config 属性配置

#### cityType - Number

* 城市数据类型 0 代表 省市数据; 1 代表 省市区 数据; 2 代表 省市区-简单版 数据;
* Default: `0`

```
	0 代表 省市数据; 
	1 代表 省市区 数据; 
	2 代表 省市区-简单版 数据;
```

#### resultType - String

* 结果类型 默认为 'path'
* Default: `'path'`


### DOM结构

    <div id="J_CityTree"></div>
    <input type="hidden" id="J_CityTreeResult"/>

### 初始化

	S.use('gallery/trees/1.0/city', function (S, City) {
		new City({
			renderTo: 'J_CityTree',
			resultId: 'J_CityTreeResult',
			cityType: 1
		});
    });
    

## Trees.Tree (Base KISSY.Tree)

* 模块名：`gallery/trees/1.0/tree`
* 本模块提供了**标准树形菜单**。
* 继承了 Trees.Base，拥有 Trees.Base 所有属性、事件、方法


### config 属性配置

#### checkable - Boolean

* 是否为多选树 （选填）
* Default: `false`

#### showRootNode - Boolean

* 是否初始展示一级节点 （选填）
* Default: `true`

#### showAll - Boolean

* 是否初始展示全部节点 （选填）
* Default: `false`

#### isLazyLoad - Boolean

* 是否使用懒加载来优化多节点效率问题 默认不使用 （选填）
* Default: `false`

#### lazyCount - Number

* 懒加载步长
* Default: `5`

#### lazyTime - Number

* 懒加载间隔
* Default: `300`

#### title - String

* tree根节点的标题
* Default: `'Tree'`

#### prefixCls - String

* 树html节点class前缀，用于自定义皮肤 （选填）
* Default: `''`


### 支持方法

#### showNodeById(id)

* 通过id定位并选中节点 id可为id列表
* `id` - String|Number|Array - 视id或id列表
* Returns: (Object)  自身对象   

#### showNodeByPath(path)

* 通过path定位并选中节点 path可为path列表
* `path` - Array - path或path列表
* Returns: (Object)  自身对象   

#### getChildrenByNode(node)

* 获取节点的子节点
* `node` - Object - 目标节点
* Returns: (Array)   子节点列表    

#### getNodeChildrenData(node)

* 获取节点的子节点数据
* `node` - Object - 节点对象
* Returns: (Array)   子节点数据   

#### getTree()

* 获取 KISSY.Tree 对象
* Returns: (Object)  KISSY.Tree 对象   

#### getTreeResult()

* 遍历树的选择结果 会触发 resultUpdate 事件
* Returns: (Array) 结果集 

#### clearSelect()

* 清空树的选中，初始化树的展开状态
* Returns: (Object)  自身对象   

#### addNodes(node, isLazyLoad)

* 给节点增加子节点 子节点数据由这个节点的id在store中查询而来
* `node` - Object - 目标节点对象
* `isLazyLoad` - Boolean - 是否启用异步懒加载
* Returns: (Object)  添加子节点后的节点对象    

#### initTreeNode(isShowRootNode)

* 给初始化树的节点
* `isShowRootNode` - Boolean - 是否是根节点

#### isNodeSelected(node)

* 判断目标节点是否为选中状态
* `node` - Object - 目标节点对象
* Returns: (Boolean)  是否选中    

#### nodeCollapse(node)

* 收起节点
* `node` - Object - 目标节点对象

#### nodeExpand(node)

* 展开节点
* `node` - Object - 目标节点对象

#### nodeSelect(node, [isSelect])

* 选中节点，会触发 selected 事件
* `node` - Object - 目标节点对象
* `isSelect` - Boolean - 是否需要选中 默认为true
* Returns: (Object)  自身对象   

#### resetTitle(title)

* 重置树的标题
* `title` - String - 标题


### 支持事件

#### click

* 代理 KISSY.Tree 的 click 事件 当树节点被点击后触发
* `e.targetNode` - 树的节点对象

#### selected

* 节点选中后触发的事件，**注意：点击节点的时候，不会触发该事件，只会触发click**
* `e.targetNode` - 树的节点对象

#### collapse

* 代理 KISSY.Tree 的 collapse 事件 当树节点收缩后触发
* `e.targetNode` - 树的节点对象

#### expand

* 代理 KISSY.Tree 的 expand 事件 当树节点扩展后触发
* `e.targetNode` - 树的节点对象



### DOM结构

    <div id="J_Tree"></div>
    <input type="hidden" id="J_TreeResult"/>

### 初始化

	S.use('gallery/trees/1.0/tree', function (S, Tree) {
		new Tree({
			renderTo: 'J_Tree',
			resultId: 'J_TreeResult',
			url: 'data.html',
			title: 'Demo Tree',
			checkable: true,
			isLazyLoad: true,
			resultType: 'id'
		});
    });


