// ==UserScript==
// @name        bili-mobile-recommend
// @namespace   Gizeta.Debris.BiliMobileRecommend
// @description Show recommendation on PC
// @match       *://www.bilibili.com/index.html
// @version     1
// @grant       none
// ==/UserScript==
let lastIdx = 0;
let frame = `
<div id="mobile_recommend" class="zone-wrap-module report-wrap-module report-scroll-module clearfix">
  <div class="live-module clearfix">
    <div class="l-con">
      <div class="zone-title">
        <div class="headline clearfix">
          <i class="icon icon_t icon-special" style="background-position:-141px -780px"></i>
          <a href="#" class="name">推荐</a>
          <div class="read-push" onclick="javascript:getFeedIndex()"><i class="icon icon_read"></i><span class="info">刷新</span></div>
        </div>
      </div>
      <div class="storey-box clearfix"></div>
    </div>
  </div>
</div>`;
let template = `
<div class="card-live-module">
  <a href="{url}" target="_blank">
    <div class="pic">
      <div class="lazy-img">
        <img alt="{title}" src="{cover}">
      </div>
      <span class="type">{type}</span>
    </div>
    <p title="{title}" class="t">{title}</p>
    <p class="num">
      <span class="auther"><i class="icon"></i>{author}</span>
      <span class="online"><i class="icon"></i>{play}</span>
    </p>
  </a>
</div>`;

window.getFeedIndex = () => {
  fetch(`//app.bilibili.com/x/feed/index?access_key={key}&appkey=1d8b6e7d45233436&build=0${lastIdx == 0 ? "" : "&idx=" + lastIdx}`)
  .then(data => data.json())
  .then(data => {
    let result = [];
    for(let item of data.data) {
      var s = template.replace(/\{title\}/g, item.title).replace(/\{author\}/g, item.name);
      switch (item.goto) {
        case "av":
        case "ad_av":
          s = s.replace(/\{cover\}/g, item.cover).replace(/\{type\}/g, item.tname).replace(/\{play\}/g, item.play);
          s = s.replace(/\{url\}/g, "//www.bilibili.com/video/av" + item.uri.split('/').pop());
          break;
        case "live":
          s = s.replace(/\{cover\}/g, item.cover).replace(/\{type\}/g, item.area).replace(/\{play\}/g, "live");
          s = s.replace(/\{url\}/g, "//live.bilibili.com/" + item.uri.split('/').pop());
          break;
        case "article_s":
          s = s.replace(/\{cover\}/g, item.covers[0]).replace(/\{type\}/g, item.category.name).replace(/\{play\}/g, item.play);
          s = s.replace(/\{url\}/g, "#article" + item.uri.split('/').pop());
          break;
        default:
          console.log(item);
          break;
      } 
      result.push(s);
    }
    lastIdx = data.data.pop()["idx"];
    $('#mobile_recommend .storey-box').html(result.join(''));
  }).catch(err => console.err(err));
}
$('#chief_recommend').after(frame);
getFeedIndex();
