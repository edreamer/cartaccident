// JavaScript Document

var mediaSound=null, mediaRecord=null;
var mediaTimer = null;  
var flagPlay=false, flagRecord=false;
var src=null;
$(document).ready(function() {
	//宣告事件處理函式
	$("#photo").bind("pageshow", takePhoto); //開啟photo頁面時啟動照相功能
	$("#dial").bind("pagebeforeshow", readTel); //撥號頁面讀取電話
	$("#end").bind("click", runEnd); //結束
	$("#btnPhoto").bind("click", takePhoto); //拍相片
	$("#btnRecord").bind("click", takeRecord); //錄音
	$("#btnPlay").bind("click", playSound); //播放聲音檔
	$("#appendSure").bind("click", insertTel); //確定新增
	$("#appendCancel").bind("click", appCancel); //取消新增
	$("#editSure").bind("click", editTel); //確定修改
	$("#editCancel").bind("click", editCancel); //取消修改
	$("#editDel").bind("click", delTel); //刪除頁面
	if(window.localStorage.length==0) { //如果沒有任何電話就建立預設電話
		window.localStorage.setItem("消防署", "119");
		window.localStorage.setItem("警政署", "110");
	}
});

function takePhoto() { //拍相片
	var tPhoto=$("#showPhoto"), prePhoto = $('#prePhoto');
	var fName=getNow();
	navigator.camera.getPicture(function(imageURI) { //拍照，傳回相片檔imageURI
		window.resolveLocalFileSystemURI(imageURI, function(fileEntry){
			window.requestFileSystem(LocalFileSystem.PERSISTENT,0, function(fileSystem){
				var direc = fileSystem.root.getDirectory("/mnt/sdcard/car/", {create: true},function( parent ){ //如果目錄不存在就建立
					fileEntry.copyTo(parent, fName+".jpg", function(){ //複製檔案
					}, onFileFail);
				},onFileFail);
			}, onFileFail); 
		},onFileFail);
		tPhoto.attr("src", imageURI); //顯示相片
		$('<img/>') //取得相片長寬
		 .attr('src', imageURI)                
		 .appendTo(prePhoto)                
		 .load(function() { 
			 if($(this).width() > $(this).height()) { //相片橫放
					tPhoto.attr("width", "300");
					tPhoto.attr("height", "225");
			 } else { //相片直放
					tPhoto.attr("width", "225");
					tPhoto.attr("height", "300");
			}
		 });
		 $.mobile.changePage("#photo", "fade", false, true);
	}, onFileFail, {quality: 100, destinationType: navigator.camera.DestinationType.FILE_URI }                    
	);  
}

function takeRecord() { //錄音
	if(flagPlay) { //正在播放聲音檔
		alert("正在播放錄音檔，\n請先結束播放再錄音！");
	} else {
		if(!flagRecord) { //未錄音
			var fName=getNow(); //以日期時間做為檔名
			src="car/"+fName+".mp3";
			$("#btnRecord").attr("src", "images/stopRec.png"); //改為停止錄音圖示
			flagRecord=true; //設定錄音旗標
			$("#btnPlay").hide(); //隱藏播放聲音按鈕
			mediaRecord=new Media(src, onSuccess, onFileFail); //建立錄音物件
			if(mediaRecord) {
				mediaRecord.startRecord(); //開始錄音
			}
			if (mediaTimer == null) {  // 每秒更新一次錄音時間
				var recTime=0;
				mediaTimer = setInterval(function() {
					setAudioPosition("錄音時間：" + recTime + " 秒");
					recTime++; 
				}, 1000);  
			}  
		} else { //已錄音
			$("#btnRecord").attr("src", "images/startRec.png"); //改為開始錄音圖示
			flagRecord=false; //設定未錄音旗標
			$("#btnPlay").show(); //顯示播放聲音按鈕
			if(mediaRecord) {
				mediaRecord.stopRecord(); //停止錄音
				clearInterval(mediaTimer); //停止錄音計時
				mediaTimer = null; 
			}
		}
	}
}

function playSound() { //按試聽鈕
	if(flagRecord) { //正在錄音
		alert("目前正在錄音中，\n請先結束錄音再播放！");
	} else if(src==null) { //尚未錄音過
		alert("目前尚未錄音過，\n請先錄音才能播放！");
	} else {
		if(!flagPlay) { //未播放
			$("#btnPlay").attr("src", "images/stopPlay.png"); //改為停止播放圖示
			mediaSound=new Media(src, onSuccess, onFileFail); //建立播放物件
			$("#btnRecord").hide(); //隱藏錄音按鈕
			if(mediaSound) {
				mediaSound.play(); //開始播放
				flagPlay=true; //設定播放旗標
				if (mediaTimer == null) {  // 每秒更新一次播放時間
					mediaTimer = setInterval(function() {  
						mediaSound.getCurrentPosition(  // 取得播放位置     
							function(position) {  
								if (position < 0) {  
									$("#btnRecord").show(); //顯示錄音按鈕
									position=0;
									$("#btnPlay").attr("src", "images/startPlay.png"); //改為播放圖示
									flagPlay=false; //設定未播放旗標
									clearInterval(mediaTimer);  
									mediaTimer = null;
								}
								setAudioPosition("播放時間：" + Math.floor(position) + " 秒");  
							},  onFileFail
						);  
					}, 1000);  
				}
			}
		} else {
			if(mediaSound) {
				$("#btnRecord").show(); //顯示錄音按鈕
				$("#btnPlay").attr("src", "images/startPlay.png"); //改為播放圖示
				mediaSound.stop(); //停止播放
				flagPlay=false; //設定未播放旗標
				clearInterval(mediaTimer);  
				mediaTimer = null;
			}
		}
	}
}

function setAudioPosition(position) {  //顯示計時訊息
	$("#sndPosition").html(position);  
}  

function readTel() { //讀取電話
	var telLi=[];
	for(var i=0; i<window.localStorage.length; i+=1) {
		var name=window.localStorage.key(i); //取得電話名稱
		var value=window.localStorage.getItem(name);//取得電話號碼
		telLi.push("<li><a href='tel:" + value + "'><img src='images/dial.png' class='ui-li-icon'/>" + name + " " + value + "</a><a href='#edit' data-icon='gear' telName='" + name + "'></a></li>"); //加入ListView
	}
	$("#lstTel").html(telLi.join("\n"));
	$("#lstTel").listview('refresh');
	$("a", $("#lstTel")).bind("click", function(e) { //按電話項目
		getTel($(this).attr("telName"));
	});
}

function getTel(telName) { //由電話名稱取得電話號碼
	var value=window.localStorage.getItem(telName);
	$("#editName").attr("value", telName); //將取得的資料顯示於edit頁面
	$("#editNum").attr("value", value);
	$("#editDel").attr("telName", telName);
}

function editTel() { //修改電話
	var editName=$("#editName").val(), editNum=$("#editNum").val();
	if(editName!="" && editNum!="") { //如果名稱或號碼未輸入就不處理
		window.localStorage.setItem(editName, editNum);
		$.mobile.changePage("#dial", "fade", false, true);
	}
}

function delTel() { //刪除電話
	var flagConfirm=confirm("確定要刪除嗎？"); //顯示確認視窗
	if(flagConfirm) { //按OK鈕
		var telName=$("#editDel").attr("telName");
		window.localStorage.removeItem(telName);
		$.mobile.changePage("#dial", "fade", false, true);
	}
}

function insertTel() { //新增電話
	var appendName=$("#appendName").val(), appendNum=$("#appendNum").val();
	if(appendName!="" && appendNum!="") {
		window.localStorage.setItem(appendName, appendNum);
		$("#appendName").attr("value", ""); //清除輸入文字框
		$("#appendNum").attr("value", "");
		$.mobile.changePage("#dial", "fade", false, true);
	}
}

function appCancel() { //取消新增
	$("#appendName").attr("value", "");
	$("#appendNum").attr("value", "");
	$.mobile.changePage("#dial", "fade", false, true);
}

function editCancel() { //取消修改
	$.mobile.changePage("#dial", "fade", false, true);
}

function runEnd() { //結束
	var flagConfirm=confirm("確定要結束本應用程式嗎？"); //顯示確認視窗
	if(flagConfirm) { //按OK鈕
		navigator.app.exitApp();
	}
}

function getNow() { //取得日期時間字串
	var now=new Date();
	var year=now.getYear()+1900;
	var month=now.getMonth()+1;
	var day=now.getDate();
	var hour=now.getHours();
	var minute=now.getMinutes();
	var sec=now.getSeconds();
	var retNow=year+twoDigit(month)+twoDigit(day)+twoDigit(hour)+twoDigit(minute)+twoDigit(sec);
	return retNow;
}

function twoDigit(n) { //轉換數值為二位數
	var retN;
	if(n<10) {
		retN="0" + n;
	} else {
		retN=n;
	}
	return retN;	
}

function onSuccess() { }

function onFileFail(error) { }
