import i18next from 'i18next';
import resources from './locales/index.js';
import validate from './validate.js';
import render from './view.js';
import fetchRss from './api-client.js';
import updatePosts from './updatePosts.js';
import updateAllRss from './updateAllRss.js';

export default () => {
  const state = {
    uiState: {
      visitedIds: [],
      modal: {
        targetPostId: '',
      },
    },
    urlSubmitProcess: {
      state: 'filling',
      errorKey: 'success',
    },
    feeds: [],
    posts: [],
  };

  const i18nextInstance = i18next.createInstance();

  i18nextInstance
    .init({
      lng: 'ru',
      debug: 'true',
      resources,
    })
    .then(() => {
      const rssFormEl = document.querySelector('.rss-form');
      const modal = document.getElementById('modal');
      const view = render(state, i18nextInstance);

      modal.addEventListener('show.bs.modal', (event) => {
        const button = event.relatedTarget;
        const targetId = button.getAttribute('data-id');
        view.uiState.modal.targetPostId = targetId;
        view.uiState.visitedIds.push(targetId);
      });

      rssFormEl.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const website = formData.get('url');
        view.urlSubmitProcess.state = 'sending';
        validate(website, view).then(() => {
          if (state.urlSubmitProcess.state === 'valid') {
            fetchRss(website)
              .then((parsedData) => {
                view.urlSubmitProcess.state = 'success';
                view.urlSubmitProcess.errorKey = 'success';
                updatePosts(state, parsedData, i18nextInstance);
              })
              .catch((err) => {
                view.urlSubmitProcess.state = 'invalidRss';
                if (err.isParsingError) {
                  view.urlSubmitProcess.errorKey = 'invalidRss';
                } else {
                  view.urlSubmitProcess.errorKey = 'networkError';
                }
              });
          }
        });
      });
      setTimeout(() => updateAllRss(state, i18nextInstance), 5000);
    })
    .catch((err) => console.log('something went wrong loading', err));
};
