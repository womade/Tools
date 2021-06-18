docute.init({
    landing: 'landing.html',
    title: 'Music-Player',
    repo: 'womade/Tools',
    weibo: '楊遠徵',
    'edit-link': 'https://t.ssss.fun/Blog-Music',

    plugins: [
        docsearch({
            apiKey: '',
            indexName: 'aplayer',
            tags: ['english', 'zh-Hans'],
            url: 'https://i.ssss.fun'
        }),
        player()
    ]
});

function player () {
    return function (context) {
        context.event.on('landing:updated', function () {
            console.log('landing:updated');
            clearPlayer();
            aplayer();
        });
        context.event.on('content:updated', function () {
            console.log('content:updated');
            clearPlayer();
            for (let i = 0; i < document.querySelectorAll('.load').length; i++) {
                document.querySelectorAll('.load')[i].addEventListener('click', function () {
                    window[this.parentElement.id] && window[this.parentElement.id]();
                });
            }
        });
    };
}

function clearPlayer () {
    for (let i = 0; i < 10; i++) {
        if (window['ap' + i]) {
            window['ap' + i].destroy();
        }
    }
}

function aplayer () {
    window.ap1 = new APlayer({
        container: document.getElementById('aplayer'),
        theme: '#F57F17',
        lrcType: 3,
        audio: [{
            name: '爱，很简单',
            artist: '陶喆',
            url: 'https://file.ssss.fun/?/%E5%8D%9A%E5%AE%A2%E6%96%87%E4%BB%B6/%E8%83%8C%E6%99%AF%E9%9F%B3%E4%B9%90/%E9%99%B6%E5%96%86%20-%20%E7%88%B1%EF%BC%8C%E5%BE%88%E7%AE%80%E5%8D%95.mp3',
            cover: 'https://s.ssss.fun/HI.png',
            lrc: '',
            theme: '#FF0000'
        }, {
            name: '突然好想你',
            artist: '五月天',
            url: 'https://file.ssss.fun/?/Share-P/BLOG/Music/%E4%BA%94%E6%9C%88%E5%A4%A9%20-%20%E7%AA%81%E7%84%B6%E5%A5%BD%E6%83%B3%E4%BD%A0.ape',
            cover: 'https://t.ssss.fun/Blog-Music/Cover/五月天%20-%20突然好想你.jpg',
            lrc: 'https://t.ssss.fun/Blog-Music/Lrc/五月天%20-%20突然好想你.lrc',
            theme: '#FF0000'
        }, {
            name: '你不是真正的快乐',
            artist: '五月天',
            url: 'https://t.ssss.fun/Blog-Music/Music/五月天%20-%20你不是真正的快乐.mp3',
            cover: 'https://t.ssss.fun/Blog-Music/Cover/五月天%20-%20你不是真正的快乐.jpg',
            lrc: 'https://t.ssss.fun/Blog-Music/Lrc/五月天%20-%20你不是真正的快乐.lrc',
            theme: '#FF0000'
        }, {
            name: '倔强',
            artist: '五月天',
            url: 'https://t.ssss.fun/Blog-Music/Music/五月天%20-%20倔强.mp3',
            cover: 'https://t.ssss.fun/Blog-Music/Cover/五月天%20-%20倔强.jpg',
            lrc: 'https://t.ssss.fun/Blog-Music/Lrc/五月天%20-%20倔强.lrc',
            theme: '#FF0000'
        }, {
            name: '知足',
            artist: '五月天',
            url: 'https://t.ssss.fun/Blog-Music/Music/五月天%20-%20知足.mp3',
            cover: 'https://t.ssss.fun/Blog-Music/Cover/五月天%20-%20知足.jpg',
            lrc: 'https://t.ssss.fun/Blog-Music/Lrc/五月天%20-%20知足.lrc',
            theme: '#FF0000'
        }, {
            name: '温柔',
            artist: '五月天',
            url: 'https://t.ssss.fun/Blog-Music/Music/五月天%20-%20温柔.mp3',
            cover: 'https://t.ssss.fun/Blog-Music/Cover/五月天%20-%20温柔.jpg',
            lrc: 'https://t.ssss.fun/Blog-Music/Lrc/五月天%20-%20温柔.lrc',
            theme: '#FF0000'
        }, {
            name: 'Mojito',
            artist: '周杰伦',
            url: 'https://file.ssss.fun/?/%E5%A8%B1%E4%B9%90%E4%B8%AD%E5%BF%83/%E9%9F%B3%E4%B9%90/%E5%91%A8%E6%9D%B0%E4%BC%A6%E5%90%88%E8%BE%91/%E5%91%A8%E6%9D%B0%E4%BC%A6%20-%20Mojito.mp3',
            cover: 'https://s.ssss.fun/HI.png',
            lrc: '',
            theme: '#FF0000'
        }, {
            name: '烟花易冷',
            artist: '周杰伦',
            url: 'https://file.ssss.fun/?/%E5%A8%B1%E4%B9%90%E4%B8%AD%E5%BF%83/%E9%9F%B3%E4%B9%90/%E5%91%A8%E6%9D%B0%E4%BC%A6%E5%90%88%E8%BE%91/%E5%91%A8%E6%9D%B0%E4%BC%A6%20-%20%E7%83%9F%E8%8A%B1%E6%98%93%E5%86%B7.ape',
            cover: 'https://s.ssss.fun/HI.png',
            lrc: '',
            theme: '#FF0000'
        }, {
            name: '说好不哭',
            artist: '周杰伦',
            url: 'https://file.ssss.fun/?/%E5%A8%B1%E4%B9%90%E4%B8%AD%E5%BF%83/%E9%9F%B3%E4%B9%90/%E5%91%A8%E6%9D%B0%E4%BC%A6%E5%90%88%E8%BE%91/%E5%91%A8%E6%9D%B0%E4%BC%A6%20-%20%E8%AF%B4%E5%A5%BD%E4%B8%8D%E5%93%AD.flac',
            cover: 'https://s.ssss.fun/HI.png',
            lrc: '',
            theme: '#FF0000'
        }, {
            name: '青花瓷',
            artist: '周杰伦',
            url: 'https://file.ssss.fun/?/%E5%A8%B1%E4%B9%90%E4%B8%AD%E5%BF%83/%E9%9F%B3%E4%B9%90/%E5%91%A8%E6%9D%B0%E4%BC%A6%E5%90%88%E8%BE%91/%E5%91%A8%E6%9D%B0%E4%BC%A6-%E9%9D%92%E8%8A%B1%E7%93%B7.ape',
            cover: 'https://s.ssss.fun/HI.png',
            lrc: '',
            theme: '#FF0000'
        }, {
            name: '不能说的秘密',
            artist: '周杰伦',
            url: 'https://file.ssss.fun/?/%E5%A8%B1%E4%B9%90%E4%B8%AD%E5%BF%83/%E9%9F%B3%E4%B9%90/%E5%91%A8%E6%9D%B0%E4%BC%A6%E5%90%88%E8%BE%91/%E5%91%A8%E6%9D%B0%E4%BC%A6-%E4%B8%8D%E8%83%BD%E8%AF%B4%E7%9A%84%E7%A7%98%E5%AF%86.ape',
            cover: 'https://s.ssss.fun/HI.png',
            lrc: '',
            theme: '#FF0000'
        }, {
            name: '等你下课',
            artist: '周杰伦',
            url: 'https://file.ssss.fun/?/%E5%A8%B1%E4%B9%90%E4%B8%AD%E5%BF%83/%E9%9F%B3%E4%B9%90/%E5%91%A8%E6%9D%B0%E4%BC%A6%E5%90%88%E8%BE%91/29.%E5%91%A8%E6%9D%B0%E4%BC%A6%20-%20%E7%AD%89%E4%BD%A0%E4%B8%8B%E8%AF%BE.flac',
            cover: 'https://s.ssss.fun/HI.png',
            lrc: '',
            theme: '#FF0000'
        }, {
            name: '七里香',
            artist: '周杰伦',
            url: 'https://file.ssss.fun/?/%E5%A8%B1%E4%B9%90%E4%B8%AD%E5%BF%83/%E9%9F%B3%E4%B9%90/%E5%91%A8%E6%9D%B0%E4%BC%A6%E5%90%88%E8%BE%91/%E4%B8%83%E9%87%8C%E9%A6%99/%E5%91%A8%E6%9D%B0%E4%BC%A6%20-%20%E4%B8%83%E9%87%8C%E9%A6%99.flac',
            cover: 'https://s.ssss.fun/HI.png',
            lrc: '',
            theme: '#FF0000'
        }, {
            name: '东风破',
            artist: '周杰伦',
            url: 'https://file.ssss.fun/?/%E5%A8%B1%E4%B9%90%E4%B8%AD%E5%BF%83/%E9%9F%B3%E4%B9%90/%E5%91%A8%E6%9D%B0%E4%BC%A6%E5%90%88%E8%BE%91/%E5%8F%B6%E6%83%A0%E7%BE%8E/MP3/%E5%91%A8%E6%9D%B0%E4%BC%A6%20-%20%E4%B8%9C%E9%A3%8E%E7%A0%B4.mp3',
            cover: 'https://s.ssss.fun/HI.png',
            lrc: '',
            theme: '#FF0000'
        }, {
            name: '晴天',
            artist: '周杰伦',
            url: 'https://file.ssss.fun/?/%E5%A8%B1%E4%B9%90%E4%B8%AD%E5%BF%83/%E9%9F%B3%E4%B9%90/%E5%91%A8%E6%9D%B0%E4%BC%A6%E5%90%88%E8%BE%91/%E5%8F%B6%E6%83%A0%E7%BE%8E/MP3/%E5%91%A8%E6%9D%B0%E4%BC%A6%20-%20%E6%99%B4%E5%A4%A9.mp3',
            cover: 'https://s.ssss.fun/HI.png',
            lrc: '',
            theme: '#FF0000'
        }, {
            name: '听妈妈的话',
            artist: '周杰伦',
            url: 'https://file.ssss.fun/?/%E5%A8%B1%E4%B9%90%E4%B8%AD%E5%BF%83/%E9%9F%B3%E4%B9%90/%E5%91%A8%E6%9D%B0%E4%BC%A6%E5%90%88%E8%BE%91/%E4%BE%9D%E7%84%B6%E8%8C%83%E7%89%B9%E8%A5%BF/MP3/%E5%91%A8%E6%9D%B0%E4%BC%A6%20-%20%E5%90%AC%E5%A6%88%E5%A6%88%E7%9A%84%E8%AF%9D.mp3',
            cover: 'https://s.ssss.fun/HI.png',
            lrc: '',
            theme: '#FF0000'
        }, {
            name: '夜的第七章',
            artist: '周杰伦',
            url: 'https://file.ssss.fun/?/%E5%A8%B1%E4%B9%90%E4%B8%AD%E5%BF%83/%E9%9F%B3%E4%B9%90/%E5%91%A8%E6%9D%B0%E4%BC%A6%E5%90%88%E8%BE%91/%E4%BE%9D%E7%84%B6%E8%8C%83%E7%89%B9%E8%A5%BF/MP3/%E5%91%A8%E6%9D%B0%E4%BC%A6%20-%20%E5%A4%9C%E7%9A%84%E7%AC%AC%E4%B8%83%E7%AB%A0.mp3',
            cover: 'https://s.ssss.fun/HI.png',
            lrc: '',
            theme: '#FF0000'
        }, {
            name: '千里之外',
            artist: '周杰伦+费玉清',
            url: 'https://file.ssss.fun/?/%E5%A8%B1%E4%B9%90%E4%B8%AD%E5%BF%83/%E9%9F%B3%E4%B9%90/%E5%91%A8%E6%9D%B0%E4%BC%A6%E5%90%88%E8%BE%91/%E4%BE%9D%E7%84%B6%E8%8C%83%E7%89%B9%E8%A5%BF/MP3/%E5%91%A8%E6%9D%B0%E4%BC%A6%2B%E8%B4%B9%E7%8E%89%E6%B8%85%20-%20%E5%8D%83%E9%87%8C%E4%B9%8B%E5%A4%96.mp3',
            cover: 'https://s.ssss.fun/HI.png',
            lrc: '',
            theme: '#FF0000'
        }, {
            name: '断了的弦',
            artist: '周杰伦',
            url: 'https://file.ssss.fun/?/%E5%A8%B1%E4%B9%90%E4%B8%AD%E5%BF%83/%E9%9F%B3%E4%B9%90/%E5%91%A8%E6%9D%B0%E4%BC%A6%E5%90%88%E8%BE%91/%E5%AF%BB%E6%89%BE%E5%91%A8%E6%9D%B0%E4%BC%A6/MP3/%E5%91%A8%E6%9D%B0%E4%BC%A6%20-%20%E6%96%AD%E4%BA%86%E7%9A%84%E5%BC%A6.mp3',
            cover: 'https://s.ssss.fun/HI.png',
            lrc: '',
            theme: '#FF0000'
        }, {
            name: '算什么男人',
            artist: '周杰伦',
            url: 'https://file.ssss.fun/?/%E5%A8%B1%E4%B9%90%E4%B8%AD%E5%BF%83/%E9%9F%B3%E4%B9%90/%E5%91%A8%E6%9D%B0%E4%BC%A6%E5%90%88%E8%BE%91/%E5%93%8E%E5%91%A6%EF%BC%8C%E4%B8%8D%E9%94%99%E5%93%A6/MP3/%E5%91%A8%E6%9D%B0%E4%BC%A6%20-%20%E7%AE%97%E4%BB%80%E4%B9%88%E7%94%B7%E4%BA%BA.mp3',
            cover: 'https://s.ssss.fun/HI.png',
            lrc: '',
            theme: '#FF0000'
        }, {
            name: '不能说的秘密',
            artist: '周杰伦',
            url: 'https://file.ssss.fun/?/%E5%A8%B1%E4%B9%90%E4%B8%AD%E5%BF%83/%E9%9F%B3%E4%B9%90/%E5%91%A8%E6%9D%B0%E4%BC%A6%E5%90%88%E8%BE%91/%E5%91%A8%E6%9D%B0%E4%BC%A6-%E4%B8%8D%E8%83%BD%E8%AF%B4%E7%9A%84%E7%A7%98%E5%AF%86.ape',
            cover: 'https://s.ssss.fun/HI.png',
            lrc: '',
            theme: '#FF0000'
        }, {
            name: '告白气球',
            artist: '周杰伦',
            url: 'https://file.ssss.fun/?/%E5%A8%B1%E4%B9%90%E4%B8%AD%E5%BF%83/%E9%9F%B3%E4%B9%90/%E5%91%A8%E6%9D%B0%E4%BC%A6%E5%90%88%E8%BE%91/%E5%91%A8%E6%9D%B0%E4%BC%A6%E7%9A%84%E5%BA%8A%E8%BE%B9%E6%95%85%E4%BA%8B/MP3/%E5%91%A8%E6%9D%B0%E4%BC%A6%20-%20%E5%91%8A%E7%99%BD%E6%B0%94%E7%90%83.mp3',
            cover: 'https://s.ssss.fun/HI.png',
            lrc: '',
            theme: '#FF0000'
        }, {
            name: '床边故事',
            artist: '周杰伦',
            url: 'https://file.ssss.fun/?/%E5%A8%B1%E4%B9%90%E4%B8%AD%E5%BF%83/%E9%9F%B3%E4%B9%90/%E5%91%A8%E6%9D%B0%E4%BC%A6%E5%90%88%E8%BE%91/%E5%91%A8%E6%9D%B0%E4%BC%A6%E7%9A%84%E5%BA%8A%E8%BE%B9%E6%95%85%E4%BA%8B/MP3/%E5%91%A8%E6%9D%B0%E4%BC%A6%20-%20%E5%BA%8A%E8%BE%B9%E6%95%85%E4%BA%8B.mp3',
            cover: 'https://s.ssss.fun/HI.png',
            lrc: '',
            theme: '#FF0000'
        }]
    });
}
