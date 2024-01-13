/*
 * @description: 
 * @技术支持: 中國遠徵
 * @官方网站: https://muyu.ssss.fun
 */
const muyu = document.querySelector("#muyu-img");
const listBox = document.querySelector(".gongde");
const setting = document.querySelector(".setting");
var gd = 100;
//声音素材
const audio = new Audio();
audio.src = "./static/audio.mp3"
audio.volume = 1;

//动态创建功德弹窗
const createAlert = () => {
  audio.pause()
  audio.play()
  const div = document.createElement("div");
  div.className = "gongde-item"
  div.innerText = `功德 ${gd > 0 ? '+' : ''}${gd}`
  setTimeout(() => {
    listBox.removeChild(div);
  }, 1900);
  listBox.append(div)
}

//木鱼点击后的效果
const muyuScale = () => {
  muyu.className = 'clickDown'
  setTimeout(_ => {
    muyu.className = ''
  }, 180)
}

let lastTime = new Date().getTime();

//木鱼图片按下事件
muyu.onclick = () => {
  if (new Date().getTime() - 60 > lastTime) {
    createAlert()
    muyuScale();
    lastTime = new Date().getTime();
  }
}
//监听空格键按下事件
window.addEventListener("keydown", function (event) {
  const { code } = event;
  if (code == 'Space') {
    if (new Date().getTime() - 60 > lastTime) {
      muyuScale();
      createAlert()
      lastTime = new Date().getTime();
    }
  }
})

//设置按钮
setting.onclick = () => {
  const gdNumber = prompt("请输入功德值：")
  gd = Number(gdNumber)
}