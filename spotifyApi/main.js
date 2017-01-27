require('universal-fetch');
const R = require('ramda');

const artists = [ '7xZHrltZh8zIRvjimgABvj', '1uFG5Tg7iA7wd56RchxvWw',
  '4boY3fDYvqcujNmLZpQdbc', '4ksCwAPgMi8rkQwwR3nMos', '4ksdsPgMi8rkQwwR3nMos',
  '2tyMOS8xKREgpEwHnLc6EX', '0dmPX6ovclgOy8WWJaFEUU' ];

// ____________________________________step1_______________________

const printStep = step => data => console.log(`\n\n============== ${step}: \n\n`, data);
const baseUrl = 'http://api.spotify.com';
const artistsUrl = id => `${baseUrl}/v1/artists/${id}`;
const parseJSON = res => res.json && res.json() || res;

const request = url => fetch(url).then(parseJSON).catch(err => console.log(err));

const isNotNull = x => x.id;
const knownArtists = R.filter(isNotNull);
const getArtist = id => request(artistsUrl(id));
const getArtists = R.map(getArtist);
const getNames = R.pluck('name');
const filterAndSortArtistsNames = R.compose(R.sortBy(R.identity), getNames);
const allArtists = Promise.all(getArtists(artists)).then(knownArtists);
allArtists.then(filterAndSortArtistsNames).then(printStep('STEP1'));

// ____________________________________step2_______________________

const artistsRelatedUrl = id => `${baseUrl}/v1/artists/${id}/related-artists`;
const getRelated = ({ id }) => request(artistsRelatedUrl(id))
const getRelatedArtists = artists => Promise.all(R.map(getRelated, artists)).then(R.pluck('artists')).then(data => ({
  artists,
  related: getMostPopularArtists(data),
}));
const getPopularity = R.prop('popularity');
const sortByPopularity = R.compose(R.take(2), R.sort(R.descend(getPopularity)))
const getMostPopularArtists = R.compose(R.uniqBy(R.prop('id')), R.flatten, R.map(sortByPopularity));
const mergeAndConcatArtists = ({ artists, related }) => R.concat(artists, related);
const sortArtistByName = R.sort(R.ascend(R.prop('name')))
const allRelatedArtists = allArtists.then(getRelatedArtists).then(mergeAndConcatArtists).then(R.compose(R.uniqBy(R.prop('id')), sortArtistByName))
allRelatedArtists.then(R.pluck('name')).then(printStep('STEP2'));

// ____________________________________step3_______________________

const country = '?country=FR';
const getTopTracksUrl = id => `${baseUrl}/v1/artists/${id}/top-tracks/${country}`;
const requestTopTracks = ({ id }) => request(getTopTracksUrl(id));
const _sortByPopularity = R.compose(R.take(5), R.sort(R.descend(getPopularity)));
const getNameByAlbum = R.pluck('name');
const getMostPopularTracks = R.compose(R.flatten, R.map(_sortByPopularity));
const getArtistName = R.pluck('name');
const getTracksAndPopularity = ({ album, popularity }) => [ album.artists[0].name, album.name, popularity ];
const sortMostPopularSongs = R.sort((a ,b) => (-a[2]) - (-b[2]));
const getTopTracks = artists => Promise.all(R.map(requestTopTracks, artists))
  .then(R.pluck('tracks')).then(getMostPopularTracks).then(R.map(getTracksAndPopularity)).then(sortMostPopularSongs).then(R.take(5));
const topTracksArtists = allRelatedArtists.then(getTopTracks).then(printStep('STEP3'));
