console.log("\n %c 中國遠徵 %c https://i.ssss.fun \n", "color: #fadfa3; background: #030307; padding:5px 0;", "background: #fadfa3; padding:5px 0;")
var volume = 0.8;

// 获取地址栏参数
// 创建URLSearchParams对象并传入URL中的查询字符串
const params = new URLSearchParams(window.location.search);

var ssss = {
  // 音乐节目切换背景
  changeMusicBg: function (isChangeBg = true) {
    const ssssMusicBg = document.getElementById("music_bg")

    if (isChangeBg) {
      // player loadeddata 会进入此处
      const musiccover = document.querySelector("#ssssMusic-page .aplayer-pic");
      var img = new Image();
      img.src = extractValue(musiccover.style.backgroundImage);
      img.onload = function() {
        ssssMusicBg.style.backgroundImage = musiccover.style.backgroundImage;
      };
    } else {
      // 第一次进入，绑定事件，改背景
      let timer = setInterval(()=>{
        const musiccover = document.querySelector("#ssssMusic-page .aplayer-pic");
        // 确保player加载完成
        // console.info(ssssMusicBg);
        if (musiccover) {
          clearInterval(timer)
          //初始化音量
          document.querySelector('meting-js').aplayer.volume(0.8,true);
          // 绑定事件
          ssss.addEventListenerChangeMusicBg();
        }
      }, 100)
    }
  },
  addEventListenerChangeMusicBg: function () {
    const ssssMusicPage = document.getElementById("ssssMusic-page");
    ssssMusicPage.querySelector("meting-js").aplayer.on('loadeddata', function () {
      ssss.changeMusicBg();
      // console.info('player loadeddata');
    });
  },
  getCustomPlayList: function() {
    const ssssMusicPage = document.getElementById("ssssMusic-page");
    if (params.get("id") && params.get("server")) {
      console.log("获取到自定义内容")
      var id = params.get("id")
      var server = params.get("server")
      ssssMusicPage.innerHTML = `<meting-js id="${id}" server=${server} type="playlist" mutex="true" preload="auto" order="random"></meting-js>`;
    }else {
      console.log("无自定义内容")
      ssssMusicPage.innerHTML = `<meting-js id="${userId}" server="${userServer}" type="playlist" mutex="true" preload="auto" order="random"></meting-js>`;
    }
    ssss.changeMusicBg(false);
  }
}

// 调用
ssss.getCustomPlayList();


// 改进vh
const vh = window.innerHeight * 1;
document.documentElement.style.setProperty('--vh', `${vh}px`);

window.addEventListener('resize', () => {
  let vh = window.innerHeight * 1;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
});

//获取图片url
function extractValue(input) {
  var valueRegex = /\("([^\s]+)"\)/g;
  var match = valueRegex.exec(input);
  return match[1];
}

//空格控制音乐
document.addEventListener("keydown", function(event) {
  //暂停开启音乐
  if (event.code === "Space") {
    event.preventDefault();
    document.querySelector('meting-js').aplayer.toggle();
  };
  //切换下一曲
  if (event.keyCode === 39) {
    event.preventDefault();
    document.querySelector('meting-js').aplayer.skipForward();
  };
  //切换上一曲
  if (event.keyCode === 37) {
    event.preventDefault();
    document.querySelector('meting-js').aplayer.skipBack();
  }
  //增加音量
  if (event.keyCode === 38) {
    if (volume <= 1) {
      volume += 0.1;
      document.querySelector('meting-js').aplayer.volume(volume,true);
    }
  }
  //减小音量
  if (event.keyCode === 40) {
    if (volume >= 0) {
      volume += -0.1;
      document.querySelector('meting-js').aplayer.volume(volume,true);
    }
  }
});