class TunnelUtils {
	static performTunneling() {
		return executeEmbedSearch();
	}

	static getItemTitle() {
		return executeTitleSearch();
	}
}

const executeTitleSearch = () => {
	let script;

	return getCurrentUrl()
		.then(url => {
			if (url.indexOf('playbuzz.com') !== -1) {
				script = `document.querySelector('h1.article-title').innerText`;
			} else {
				script = `document.querySelector('iframe[data-id]').contentWindow.document.title`;
			}
		})
		.then(() => {
			chrome.tabs.executeScript(null, {code: `console.log(${script})`});
			return new Promise((resolve, reject) => {
			    chrome.tabs.executeScript(null, {code:script},
					(results) => {
				        resolve(results);
				    }
			    );
			});
		})
		.then((res) => {
			return res[0];
		})
}

const executeEmbedSearch = (fileName) => {
	let script;
	let environment;

	return isPlaybuzzDomain()
		.then(is => {
			script = is ? getNativeItemId : getEmbeddedItemId;
			return getEnvironment();
		})
		.then((env) => {
			environment = env;
		})
		.then(() => {
			return new Promise((resolve, reject) => {
			    chrome.tabs.executeScript(null, {code:script},
					(results) => {
				        resolve({
				        	itemId: results,
				        	environment: environment
				        });
				    }
			    );
			});
		})
		.then(res => sendTunnelRequest(res));
};

const getEmbeddedItemId = `document.querySelector('.playbuzz').getAttribute('data-id');`;
const getNativeItemId = `document.body.getAttribute('data-gameid');`;

const isPlaybuzzDomain = () => {
	return getCurrentUrl().then(url => {
		return url.indexOf('playbuzz.com') !== -1;
	});
};

const getCurrentUrl = () => {
	return new Promise((resolve, reject) => {
		const queryInfo = {
			active: true,
			currentWindow: true
		};

		chrome.tabs.query(queryInfo, (tabs) => {
			resolve(tabs[0].url);
		});
	});
};

const getEnvironment = () => {
	return getCurrentUrl().then(url => {
		return /((alpha)|(sandbox-\d{1,2}))\.playbuzz\.com/.test(url) ? 'staging': 'production';
	})
};

const sendTunnelRequest = (itemData) => {
	const domainName = (itemData.environment === 'staging') ? 'https://embed.playbuzz.com' : 'https://stg-embed.playbuzz.com';

	return fetch(`${domainName}/tunnel?id=${itemData.itemId}`, {method: 'GET'})
		.then(res => res.text())
};
