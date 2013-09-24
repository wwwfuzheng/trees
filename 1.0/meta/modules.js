config({
    'gallery/trees/index': {requires: ["gallery/trees/store", "gallery/trees/base", "gallery/trees/tree", "gallery/trees/viewstore", "gallery/trees/view", "gallery/trees/list", "gallery/trees/select", "gallery/trees/city"]},
    "gallery/trees/store": {requires: ['core']},
    "gallery/trees/base": {requires: ['gallery/trees/store', 'xtemplate', 'core']},
    "gallery/trees/tree": {requires: ['tree', 'gallery/trees/base', 'gallery/trees/tree.css']},
    "gallery/trees/view": {requires: ['gallery/trees/base', 'gallery/trees/viewstore']},
    "gallery/trees/viewstore": {requires: ['gallery/trees/store']},
    "gallery/trees/list": {requires: ['gallery/trees/view', 'gallery/trees/list.css']},
    "gallery/trees/select": {requires: ['gallery/trees/view']},
    "gallery/trees/city": {requires: ['gallery/trees/select']}
});