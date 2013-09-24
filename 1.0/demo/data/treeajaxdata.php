<?php
$id = $_POST['id'];
if($id == ''){
	$id = 0;
}
?>
{
	"success": true,
	"message": "ok",
	"nodes": [{
		"id": "<?php echo $id;?>-1",
		"value": "男装",
		"children": [],
		"parent": "<?php echo $id;?>",
		"isleaf": false
		},
		{
			"id": "<?php echo $id;?>-15",
			"value": "运动服\/运动包\/颈环配件",
			"children": [],
			"parent": "<?php echo $id;?>",
			"isleaf": false
		}
	]
}





