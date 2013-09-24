## 综述

Trees - 树形数据管理与展现

* 版本：1.0
* 作者：桐人
* demo：[http://gallery.kissyui.com/trees/1.0/demo/index.html](http://gallery.kissyui.com/trees/1.0/demo/index.html)

### 组件结构

	Tree
		|- Store		树形数据对象
		|- Base			树的基类
		|- ViewStore	视图型树数据对象 继承于 Tree.Store
		|- View			视图型树基类 继承于 Tree.Base
		|- List			列表树 继承于 Tree.View
        |- SearchSelect	带搜索的多级联动下拉框 继承于 Tree.View
		|- Select		多级联动下拉框 继承于 Tree.View
		|- City			城市联动框 继承于 Tree.Select
		|- Tree			标准树 继承于 Tree.Base


## 初始化组件

	S.use('gallery/trees/1.0/index', function (S, Trees) {
    	var list = new Trees.List(),
         	select = new Trees.Select(),
         	city = new Trees.city();
    })

## 基础模块

### Trees.Store

模块名：`gallery/trees/1.0/store`

所有树形数据均可以用本模块来处理。

本模块提供了**数据加载**、**数据遍历**等基础功能，详见API


### Trees.Base

模块名：`gallery/trees/1.0/base`

本模块提供了**数据初始化**、**结果管理**等组件基础功能。

#### 常用功能

##### 结果配置 `config.resultType`

* 配置获取结果的类型，可选填的值有：`result`, `id`, `value`, `path`, `valuePath`, `valueStr` 可以组合多个类型的值 用**空格**隔开
* 注意：只有`result`, `id`, `path`三种类型支持数据回显
* 默认值： `result`

##### 数据回显

* 需要将 `resultType` 所配置的结果，回显到 resultInput 中，即可回显结果

```
	// resultType: 'id'
	<input type="hidden" id="J_ListTreeResult" value='{"id":291}'/>
```

##### 重新加载数据

* 提供同一地址，不同参数的重新加载

```
	tree.reload(param);
```		
		
##### 通过文本搜索数据		
		
	listTree.on('searchTree', function(e){
	// 监听 searchTree 事件，展现结果列表
	});

	tree.searchTree(searchText);


### Trees.ViewStore

模块名：`gallery/trees/1.0/viewstore`

本模块提供了**数据模块视图功能**，供需要视图功能的树使用。


### Trees.View

模块名：`gallery/trees/1.0/view`

本模块提供了**视图功能树**的基本功能。

#### 常用功能

##### 通过id快速定位

* 快速定位视图

```
	tree.updateListsById();
```

##### 清空选择

```
	tree.clearSelect();
```

## 展现层模块

### Trees.List

模块名：`gallery/trees/1.0/list`

本模块提供了**多级列表选择框**。

#### DOM结构

    <div id="J_ListTree"></div>
    <input type="hidden" id="J_ListTreeResult"/>

#### 初始化

	S.use('gallery/trees/1.0/list', function (S, List) {
		var listTree = new S.LP.Tree.List({
			renderTo: 'J_ListTree',
			resultId: 'J_ListTreeResult',
			url: 'data.php',
			resultType: 'id'
		});	
    })

### Trees.Select

模块名：`gallery/trees/1.0/select`

本模块提供了**多级联动下拉选择框**。

### Trees.City

模块名：`gallery/trees/1.0/city`

本模块提供了**城市联动框**。

### Trees.Tree (Base KISSY.Tree)

模块名：`gallery/trees/1.0/tree`

本模块提供了**标准树形菜单**。





