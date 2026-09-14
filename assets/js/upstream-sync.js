// 上游同步状态。读取本地基准标记文件，并向 GitHub 查询上游最新提交。
// 上游仓库 STA1N156/RP-Hub 为 public，无需 token，浏览器匿名跨域即可（限流 60 次/小时）。
(function () {
    const { onBeforeUnmount, onMounted, ref, computed } = Vue;

    const BASE_FILE_URL = './upstream-base.json';
    const UPSTREAM_COMMIT_API = 'https://api.github.com/repos/STA1N156/RP-Hub/commits/main';
    // 页面重新可见时，距上次检查超过该间隔才重新请求，避免打爆匿名限流。
    const RECHECK_INTERVAL_MS = 10 * 60 * 1000;
    const SHORT_SHA_LENGTH = 7;
    const FULL_SHA_LENGTH = 40;

    const toShortSha = value => String(value == null ? '' : value).trim().slice(0, SHORT_SHA_LENGTH);

    const useUpstreamSync = () => {
        const status = ref('unknown');
        const base = ref('');
        const baseTag = ref('');
        const latest = ref('');
        const latestDate = ref('');
        const latestMessage = ref('');
        const lastChecked = ref('');

        // 内部保留完整 SHA，用于准确的「是否落后」判定。
        let baseFull = '';
        let latestFull = '';
        let lastCheckAt = 0;

        const statusLabel = computed(() => {
            switch (status.value) {
                case 'up-to-date': return '已是最新';
                case 'behind': return '上游有新版本';
                case 'error': return '无法检查';
                case 'checking': return '检查中…';
                default: return '未知';
            }
        });

        const resolveStatus = () => {
            if (!baseFull || !latestFull) {
                status.value = 'unknown';
                return;
            }
            // 前缀互为包含即视为同一提交。
            if (latestFull.startsWith(baseFull.slice(0, SHORT_SHA_LENGTH)) || baseFull.startsWith(latestFull)) {
                status.value = 'up-to-date';
                return;
            }
            // 二者都是完整 40 位且不同 → 上游领先。
            if (baseFull.length === FULL_SHA_LENGTH && latestFull.length === FULL_SHA_LENGTH) {
                status.value = 'behind';
                return;
            }
            status.value = 'unknown';
        };

        const loadBase = async () => {
            // 必须带查询串：sw.js 的 fetch handler 对带查询串的请求不接管、不缓存，
            // 否则会读到旧缓存里的基准提交。
            const response = await fetch(`${BASE_FILE_URL}?t=${Date.now()}`, { cache: 'no-store' });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            baseFull = String(data && data.base ? data.base : '').trim();
            base.value = toShortSha(baseFull);
            baseTag.value = String(data && data.tag ? data.tag : '').trim();
        };

        const loadLatest = async () => {
            const response = await fetch(UPSTREAM_COMMIT_API, { cache: 'no-store' });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            latestFull = String(data && data.sha ? data.sha : '').trim();
            latest.value = toShortSha(latestFull);
            const commit = data && data.commit ? data.commit : {};
            const dateSource = (commit.committer && commit.committer.date)
                || (commit.author && commit.author.date)
                || '';
            latestDate.value = dateSource ? new Date(dateSource).toLocaleString() : '';
            const message = commit.message ? String(commit.message) : '';
            latestMessage.value = message.split('\n')[0].trim();
        };

        const refresh = async () => {
            status.value = 'checking';
            try {
                await loadBase();
                await loadLatest();
                resolveStatus();
            } catch {
                // 任何网络/解析异常都不能影响 RP-Hub 的正常使用。
                status.value = 'error';
            } finally {
                lastChecked.value = new Date().toLocaleString();
                lastCheckAt = Date.now();
            }
        };

        const handleVisibility = () => {
            if (document.hidden) return;
            if (Date.now() - lastCheckAt < RECHECK_INTERVAL_MS) return;
            refresh();
        };

        onMounted(() => {
            refresh();
            document.addEventListener('visibilitychange', handleVisibility);
        });

        onBeforeUnmount(() => {
            document.removeEventListener('visibilitychange', handleVisibility);
        });

        return {
            status,
            statusLabel,
            base,
            baseTag,
            latest,
            latestDate,
            latestMessage,
            lastChecked,
            refresh
        };
    };

    window.RPHubUpstreamSync = Object.freeze({ useUpstreamSync });
})();
