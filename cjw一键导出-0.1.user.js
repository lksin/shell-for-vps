// ==UserScript==
// @name         cjw一键导出
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       lksin
// @match        *://hctest.cjw.cn/cjwmap/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=cjw.cn
// @grant        none
// ==/UserScript==
function sleep1(time) {
        time*=1000
        return new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, time);
        });
}

(async function() {
    'use strict';

    console.log('[WaitElement] Tampermonkey script start.');

    // 每隔 1 秒查一次，最多查 30 次（30 秒）
    let count = 0;
    const maxCount = 30;
    const timer = setInterval(() => {
        count++;
        const el = document.querySelector('#tool-plot-base');
        if (el) {
            console.log('[WaitElement] 找到 #tool-plot-base 了！', el);
            clearInterval(timer);
            doSomething(el);
        } else {
            console.log('[WaitElement] #tool-plot-base 还不存在，第', count, '次检查');
            if (count >= maxCount) {
                console.warn('[WaitElement] 超过 30 秒依然没找到 #tool-plot-base，停止轮询。');
                clearInterval(timer);
            }
        }
    }, 1000);

    function doSomething(plotBtn) {
        // 在这里给 plotBtn 加事件，或者做你想做的事
        console.log('[WaitElement] 可以在这里插入按钮等操作');
        plotBtn.addEventListener('click', () => {
        console.log('[PlotBatchDownload] 用户点击了标绘按钮！准备等待面板渲染。');

        // 2. 用 setTimeout 或轮询的方式，等待面板中的 #plot-search 出现
        //    这里简单用一个定时器模拟，如果 2 秒后仍然找不到，则提示一下
        setTimeout(() => {
            console.log('[PlotBatchDownload] 等待 2 秒后，尝试查找 #plot-search 元素...');
            addBatchDownloadButton();
        }, 2000);
    });

    /**
     * 在标绘面板出现后，插入“批量下载”按钮
     */
    function addBatchDownloadButton() {
        console.log('[PlotBatchDownload] 进入 addBatchDownloadButton() 函数');
        const searchBtn = document.querySelector('#plot-search');
        console.log('[PlotBatchDownload] 获取到的 searchBtn=', searchBtn);

        if (!searchBtn) {
            console.log('[PlotBatchDownload] 未找到 #plot-search，可能是面板还没渲染完或选择器不对。');
            return;
        }

        // 如果已经找到 #plot-search，就创建我们的“批量下载”按钮
        const batchBtn = document.createElement('button');
        batchBtn.textContent = '批量下载';
        batchBtn.className = 'layui-btn layui-btn-primary layui-btn-xs';
        batchBtn.style.marginLeft = '6px';

        // 点击后执行批量下载
    batchBtn.addEventListener('click', async () => {
    console.log('[PlotBatchDownload] 批量下载按钮被点击！开始请求数据...');

    try {
        const themeid = window.Hw.currentTheme.theme_id;
        const userid = $('#userName').attr('code');
        const keyword = document.querySelector('#plot-keyword').value || '';

        const requestBody = {
            track_total_hits: true,
            query: {
                bool: {
                    must: [
                        { term: { themeid: themeid } },
                        { term: { people: userid } },
                        { wildcard: { objname: '*' + keyword + '*' } }
                    ]
                }
            },
            size: 10000
        };

        console.log('[PlotBatchDownload] 请求体 requestBody=', requestBody);
        const resp = await fetch(BASE + 'poi/_search_plot.do', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json;charset=utf-8' },
            body: JSON.stringify(requestBody)
        });
        const json = await resp.json();
        console.log('[PlotBatchDownload] 后端返回结果=', json);

        const hits = json.hits?.hits || [];
        if (hits.length === 0) {
            alert('没有找到可下载的数据！');
            return;
        }

        // **逐个下载文件，避免并发过多**
        for (let i = 0; i < hits.length; i++) {
            const hit = hits[i];
            const s = hit._source;
            const geometry = s.locationshape;
            const { locationshape, ...props } = s;
            props.id = hit._id;

            const geojson = {
                type: 'FeatureCollection',
                features: [{
                    type: 'Feature',
                    id: hit._id,
                    geometry: geometry,
                    properties: props
                }]
            };
            const username = s.username || '未知用户';
            const objname = s.objname || `未命名_${i + 1}`;
            const blob = new Blob([JSON.stringify(geojson)], { type: 'application/json;charset=utf-8' });
            const fileName = `${username}_${objname}.json`;

            const a = document.createElement('a');
            document.body.appendChild(a);
            a.href = URL.createObjectURL(blob);
            a.download = fileName;
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(a.href);

            console.log(`[PlotBatchDownload] 下载文件 ${fileName} 成功！`);

            // **加入短暂延迟，避免浏览器限制**
            await sleep1(0.2);
        }

        console.log('[PlotBatchDownload] 批量下载完成！');
    } catch (e) {
        console.error('[PlotBatchDownload] 批量下载出错：', e);
        alert('批量下载出错，请查看控制台日志！');
    }
});


        // 最后把新按钮插入到页面中
        // 我们用 insertAdjacentElement 把它插在搜索按钮的后面
        searchBtn.insertAdjacentElement('afterend', batchBtn);
        console.log('[PlotBatchDownload] 已插入批量下载按钮！');
    }
    }
})();
