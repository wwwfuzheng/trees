/**
 * Tree组件入口文件
 * @fileoverview 
 * @author 桐人<wwwfuzheng@qq.com>
 * @module trees
 **/
KISSY.add(function(S, Store, Base, Tree, ViewStore, View, List, Select, City){
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

