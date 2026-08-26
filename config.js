/* ════════════════════════════════════════════════════════════
   JAReferee · Gameday Command Center
   config.js

   The version lives in one place: JAR.VERSION, near the bottom. It used
   to be written here in the header as well, and the two drifted -- this
   line read 2026.08.06-a while the constant said 2026.08.11-a, so anybody
   opening the file to check what was deployed got an answer two weeks
   stale. A stamp that has to be updated in two places is a stamp that
   will be wrong. Do not put a number back in this comment.

   Lives beside hub.html in whichever repo serves the tournament, and is
   loaded relatively. Nothing here names another repo, so viewing source
   on a public page reveals no internal path. It used to carry only
   BACKEND. It now carries a block per event, resolved from the URL path,
   so /steamboat/, /dic/ and everything after share the same pages and
   differ only by what is in here.

   Adding a tournament = adding one block below. No page is edited.

   The path segment is the key:
     jareferee.com/steamboat/...  -> EVENTS.steamboat
     jareferee.com/dic/...        -> EVENTS.dic
   Works whether /dic/ is its own repo or a folder, because Pages serves
   both at the same origin and this file is referenced absolutely.

   ES5 only, on purpose. These pages run on referee phones on bad rural
   wifi; nothing here should need a transpiler or a polyfill.
   ════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // The event to assume when the path segment matches nothing -- opened
  // locally, from a preview, or from an unexpected URL. Set this to the
  // event this repo serves. Getting it wrong shows another tournament's
  // data under this tournament's branding, which is how Steamboat games
  // appeared on the DIC scoreboard.
  var DEFAULT_EVENT = 'dic';

  var BACKEND = 'https://script.google.com/macros/s/AKfycbxQXvVq-gtGfUvgXF3NJXkFU_4aVlqFclU0bF0B0dQWbpjb42tstU7UnbKLf5DFP3PY/exec';

  // Relative on purpose. Whatever repo this file sits in serves the
  // assets beside it, so no other repo's name ever appears in page source.
  var ASSETS = 'assets/brand/';

  // Shown on every page of every event: this is the continuity thread.
  var HOUSE = {
    jareferee: { name: 'JAReferee', url: 'https://jareferee.com',
                 mark: ASSETS + 'jareferee-mark-light.png' },
    csrp:      { name: 'Colorado Soccer Referee Program', url: 'https://www.coloradoreferee.com',
                 mark: ASSETS + 'colorado-referee-program.png' }
  };

  var EVENTS = {

    // ── Steamboat Mountain Soccer Tournament ────────────────
    steamboat: {
      id:       'steamboat',          // must match TOURNAMENTS.ID
      path:     'steamboat',
      shield:   'SMST',
      name:     'Steamboat Mountain',
      full:     'Steamboat Mountain Soccer Tournament',
      subtitle: 'Soccer Tournament · Steamboat Springs, Colorado',
      cardBrand:'Steamboat Mountain Soccer Tournament',
      cardSub:  '42ND ANNUAL · REFEREE GAME CARD',
      accent:   '#7FB8DE',
      hub:      'jareferee.com/steamboat',
      rapUrl:   'jareferee.com/steamboat/rap',
      weatherPlace: 'Steamboat Springs',
      dates:    ['2026-07-31', '2026-08-01', '2026-08-02'],
      daylbl:   { '2026-07-31': ['Fri', 'Jul 31'],
                  '2026-08-01': ['Sat', 'Aug 1'],
                  '2026-08-02': ['Sun', 'Aug 2'] },
      venues:   ['Emerald Park', 'Memorial Park - Steamboat',
                 'Steamboat Springs High School', 'Steamboat Springs Middle School',
                 'STARS'],
      // Referee HQ / non-playing sites. Never offered as a card or score venue.
      hqVenues: ['STARS'],
      divisionOrder: ['U9/10 Boys','U9/10 Girls','U11/12 Boys','U11/12 Girls',
                      'U13/14 Boys','U13/14 Girls','U17/19 Boys Gold',
                      'U17/19 Boys Silver','U17/19 Girls'],
      // Applied in order to shorten a venue for a narrow phone header.
      trim:     [' - Steamboat', 'Steamboat Springs '],
      // Landing-page venue cards. `map` is a Google Maps destination
      // query -- a street address where one is known, otherwise the
      // venue name, which Maps resolves fine for a named park.
      venueInfo: [
        { name: 'Emerald Soccer Fields', fields: 'Dudley · North1 · North2 · South',
          addr: '500 Pamela Ln', map: '500+Pamela+Ln,+Steamboat+Springs,+CO+80487', games: 47 },
        { name: 'Memorial Soccer Fields', fields: 'Field 01 · Field 02',
          addr: '325 2nd Street', map: '325+2nd+Street,+Steamboat+Springs,+CO+80487', games: 28 },
        { name: 'Steamboat Springs High School', fields: 'Gardner Field',
          addr: '45 Maple St', map: '45+Maple+St,+Steamboat+Springs,+CO+80487', games: 14 },
        { name: 'Steamboat Springs Middle School', fields: 'Turf Field',
          addr: '39610 Amethyst Dr', map: '39610+Amethyst+Dr,+Steamboat+Springs,+CO+80487', games: 13 }
      ],
      logos:    [],
      alertWho: 'Joe, Bowen, Joey and Deanna',
      refInfo:  [
        { h: 'Where you are staying',
          p: 'Referee housing is the dorms at the STARS campus. Check in from 4 PM on Friday. Welcome packets have your room assignment, local coupons and Honey Stingers.' },
        { h: 'Food',
          p: 'Continental breakfast and lunch are provided both days. Dinner is on your own.' },
        { h: 'Game cards',
          p: 'Bowen Taylor has the game cards. Fill them out completely. Then post your score here, and complete your game report in Assignr so you get paid.' },
        { h: 'Something wrong',
          p: 'Joe Saskowski and Bowen Taylor are your site coordinators. If it is urgent, use the red Help button in the corner.' }
      ],
      host:     { name: 'Steamboat Soccer Club', url: 'https://www.steamboat-soccer.com/tournament-a' }
    },

    // ── Denver International Cup ────────────────────────────
    // 203 games, 24 divisions. Fri is Broomfield only (18); Sat and Sun
    // run both venues. Verified against the Assignr export.
    // ── Broomfield Shootout ─────────────────────────────
    // 626 games across 10 venues. League and venue strings read off the
    // Assignr scan, not typed, so they match what the filter compares.
    shootout: {
      id:       'shootout',
      path:     'shootout',
      shield:   'BSC',
      name:     'Broomfield Shootout',
      full:     '2026 Broomfield Shootout',
      subtitle: 'Hosted by Broomfield Soccer Club',
      cardBrand:'Broomfield Shootout 2026',
      cardSub:  'REFEREE GAME CARD',
      accent:   '#2E7D53',
      hub:      'jareferee.com/shootout',
      weatherPlace: 'Broomfield',
      dates:    ['2026-08-13','2026-08-14','2026-08-15','2026-08-16'],
      daylbl:   { '2026-08-13':['Thu','Aug 13'], '2026-08-14':['Fri','Aug 14'],
                  '2026-08-15':['Sat','Aug 15'], '2026-08-16':['Sun','Aug 16'] },
      venues:   ['Anthem Community Park','Broadlands','Broomfield County Commons Park',
                 'Columbine Meadows Park','Country Estates','Country Vista Park',
                 'Highland Park (Broomfield)','Legacy West Park','Spano Park',
                 'Westfield Village'],
      hqVenues: [], hqFields: [],
      trim:     [' Community Park',' County Commons Park',' Meadows Park',' (Broomfield)'],
      alertWho: 'your site coordinator and Deanna',
      refInfo:  [
        { h: 'Something wrong',
          p: 'Use the red Help button in the corner. It reaches your site coordinator and Deanna at once.' }
      ],
      host:     { name: 'Broomfield Soccer Club', url: 'https://www.broomfieldsoccer.org' }
    },

    // ── Players Cup ─────────────────────────────────────
    playerscup: {
      id:       'playerscup',
      path:     'playerscup',
      shield:   'PC',
      name:     'Players Cup',
      full:     '2026 Players Cup',
      subtitle: 'Hosted by Albion SC Boulder',
      cardBrand:'Players Cup 2026',
      cardSub:  'REFEREE GAME CARD',
      accent:   '#8E5BC6',
      hub:      'jareferee.com/playerscup',
      weatherPlace: 'Boulder',
      dates:    ['2026-08-13','2026-08-14','2026-08-15','2026-08-16'],
      daylbl:   { '2026-08-13':['Thu','Aug 13'], '2026-08-14':['Fri','Aug 14'],
                  '2026-08-15':['Sat','Aug 15'], '2026-08-16':['Sun','Aug 16'] },
      venues:   ['East Boulder Community Center','Pleasant View Fields Sports Complex',
                 'Twin Peaks Classical Academy Longmont'],
      hqVenues: [], hqFields: [],
      trim:     [' Community Center',' Fields Sports Complex',' Classical Academy Longmont'],
      alertWho: 'your site coordinator and Deanna',
      refInfo:  [
        { h: 'Something wrong',
          p: 'Use the red Help button in the corner. It reaches your site coordinator and Deanna at once.' }
      ],
      host:     { name: 'Albion SC Boulder', url: 'https://www.albionscboulder.com' }
    },

    // ── Skyline Cup ─────────────────────────────────────
    skyline: {
      id:       'skyline',
      path:     'skyline',
      shield:   'SKY',
      name:     'Skyline Cup',
      full:     '2026 Skyline Cup',
      subtitle: 'Hosted by Skyline Soccer Club',
      cardBrand:'Skyline Cup 2026',
      cardSub:  'REFEREE GAME CARD',
      accent:   '#D4762A',
      hub:      'jareferee.com/skyline',
      weatherPlace: 'Denver',
      dates:    ['2026-08-15','2026-08-16'],
      daylbl:   { '2026-08-15':['Sat','Aug 15'], '2026-08-16':['Sun','Aug 16'] },
      venues:   ['Kennedy Soccer Complex'],
      hqVenues: [], hqFields: [],
      trim:     [' Soccer Complex'],
      alertWho: 'your site coordinator and Deanna',
      refInfo:  [
        { h: 'Something wrong',
          p: 'Use the red Help button in the corner. It reaches your site coordinator and Deanna at once.' }
      ],
      host:     { name: 'Skyline Soccer Club', url: 'https://www.skylinesoccer.org' }
    },

    // ── Arsenal Cup ─────────────────────────────────────
    arsenal: {
      id:       'arsenal',
      path:     'arsenal',
      shield:   'ARS',
      name:     'Arsenal Cup',
      full:     '2026 Arsenal Cup',
      subtitle: 'Hosted by Arsenal Colorado',
      cardBrand:'Arsenal Cup 2026',
      cardSub:  'REFEREE GAME CARD',
      accent:   '#C4472F',
      hub:      'jareferee.com/arsenal',
      weatherPlace: 'Fort Collins',
      dates:    ['2026-08-20','2026-08-21','2026-08-22','2026-08-23'],
      daylbl:   { '2026-08-20':['Thu','Aug 20'], '2026-08-21':['Fri','Aug 21'],
                  '2026-08-22':['Sat','Aug 22'], '2026-08-23':['Sun','Aug 23'] },
      venues:   ['Fort Collins Soccer Complex'],
      hqVenues: [], hqFields: [],
      trim:     [' Soccer Complex'],
      alertWho: 'your site coordinator and Deanna',
      refInfo:  [
        { h: 'Something wrong',
          p: 'Use the red Help button in the corner. It reaches your site coordinator and Deanna at once.' }
      ],
      host:     { name: 'Arsenal Colorado', url: 'https://www.arsenalcolorado.com' }
    },


    // ── added 18 August ───────────────────────────────────────────
    // A TOURNAMENTS row is only half of a new event. This file carries the
    // identity a page needs before it has spoken to the backend: crest,
    // colours, day tabs, venues, host. Without a block here, ?e=uchc found
    // nothing and fell through to whatever was last stored -- which is why
    // it opened Arsenal.
    playerscupu10: {
      id:       'playerscupu10',        // must match TOURNAMENTS.ID
      path:     'playerscupu10',
      shield:   'PCJ',
      name:     'Players Cup U8-U10',
      full:     '2026 Players Cup U08-U10',
      subtitle: 'Hosted by Albion SC Boulder',
      cardBrand:'Players Cup U8-U10 2026',
      cardSub:  'REFEREE GAME CARD',
      accent:   '#2E7D53',
      hub:      'jareferee.com/playerscupu10',
      weatherPlace: 'Boulder',
      // Friday added 2026-08-20. Games numbered PCA were already sitting in
      // the cache for the 21st, but the day pills are built from this list
      // and the board only ever asks about a date somebody can tap -- so a
      // day missing here is a day of games nobody can reach. Nothing errors.
      // TOURNAMENTS.START_DATE has to move to the 21st as well, or the
      // backend will not claim the day either. Both, or neither works.
      dates:    ['2026-08-21','2026-08-22','2026-08-23'],
      daylbl:   { '2026-08-21':['Fri','Aug 21'],
                  '2026-08-22':['Sat','Aug 22'], '2026-08-23':['Sun','Aug 23'] },
      venues:   ['Pleasant View Fields Sports Complex'],
      hqVenues: [], hqFields: [],
      trim:     [' Fields Sports Complex',' Sports Complex'],
      alertWho: 'your site coordinator and Deanna',
      refInfo:  [
        { h: 'Small sided',
          p: 'U8 to U10 play 25 minute halves. No added time. Check the age band on your game card before kickoff.' },
        { h: 'Something wrong',
          p: 'Use the red Help button in the corner. It reaches your site coordinator and Deanna at once.' }
      ],
      host:     { name: 'Albion SC Boulder', url: 'https://www.albionscboulder.com' }
    },

    uchc: {
      id:       'uchealth',             // must match TOURNAMENTS.ID
      path:     'uchc',                 // the URL you hand out
      shield:   'UCH',
      name:     'UC Health Cup',
      full:     '2026 UC Health Cup',
      subtitle: 'Hosted by Colorado Soccer Association',
      cardBrand:'UC Health Cup 2026',
      cardSub:  'REFEREE GAME CARD',
      accent:   '#15294B',
      hub:      'jareferee.com/uchc',
      weatherPlace: 'Denver',
      dates:    ['2026-09-27','2026-10-03','2026-10-04','2026-10-05'],
      daylbl:   { '2026-09-27':['Sun','Sep 27'], '2026-10-03':['Sat','Oct 3'],
                  '2026-10-04':['Sun','Oct 4'],  '2026-10-05':['Mon','Oct 5'] },
      venues:   ['Fort Logan Soccer Complex'],
      hqVenues: [], hqFields: [],
      trim:     [' Soccer Complex'],
      alertWho: 'your site coordinator and Deanna',
      refInfo:  [
        { h: 'Recreational',
          p: 'U8 to U19 recreational. Half lengths vary by age band -- check your game card.' },
        { h: 'Something wrong',
          p: 'Use the red Help button in the corner. It reaches your site coordinator and Deanna at once.' }
      ],
      host:     { name: 'Colorado Soccer Association', url: 'https://www.coloradosoccer.org' }
    },

    vvsccup: {
      id:       'vailcup',              // must match TOURNAMENTS.ID
      path:     'vvsccup',              // the URL you hand out
      shield:   'VVS',
      name:     'Vail Cup',
      full:     'Cindy Eskwith Memorial Vail Cup',
      subtitle: 'Hosted by Vail Valley Soccer Club',
      cardBrand:'Vail Cup 2026',
      cardSub:  'REFEREE GAME CARD',
      accent:   '#F0A830',
      hub:      'jareferee.com/vvsccup',
      weatherPlace: 'Vail',
      dates:    ['2026-10-02','2026-10-03','2026-10-04','2026-10-05'],
      daylbl:   { '2026-10-02':['Fri','Oct 2'], '2026-10-03':['Sat','Oct 3'],
                  '2026-10-04':['Sun','Oct 4'], '2026-10-05':['Mon','Oct 5'] },
      // No venues on the TOURNAMENTS row yet. Left empty deliberately: the
      // board falls back to whatever Assignr returns rather than filtering
      // to a list that is wrong. Fill both in when the fields are known.
      venues:   [],
      hqVenues: [], hqFields: [],
      trim:     [' Soccer Complex',' Sports Complex'],
      alertWho: 'your site coordinator and Deanna',
      refInfo:  [
        { h: 'Altitude',
          p: 'Vail is at 8,000 feet. Water between games, and watch players and yourself for altitude effects.' },
        { h: 'Something wrong',
          p: 'Use the red Help button in the corner. It reaches your site coordinator and Deanna at once.' }
      ],
      host:     { name: 'Vail Valley Soccer Club', url: '' }
    },

    dic: {
      id:       'denverintl',         // must match TOURNAMENTS.ID
      path:     'dic',
      shield:   'DIC',
      name:     'Denver International Cup',
      full:     '2026 Denver International Cup',
      subtitle: 'Hosted by Colorado Rush · Broomfield and Aurora, Colorado',
      cardBrand:'Denver International Cup 2026',
      cardSub:  'HOSTED BY COLORADO RUSH · REFEREE GAME CARD',
      accent:   '#1B6CB5',
      hub:      'jareferee.com/dic',
      rapUrl:   'jareferee.com/dic/rap',
      // rulesUrl: 'rules.html',
      //   PULLED 2026-08-07. The published rules changed and rules.html is
      //   stale. Both hub entry points and the tournament-info panel are
      //   gated on rulesUrl, so commenting this out hides all of them.
      //   Put the line back once the page matches the new rules.
      weatherPlace: 'Broomfield',
      dates:    ['2026-08-07', '2026-08-08', '2026-08-09'],
      daylbl:   { '2026-08-07': ['Fri', 'Aug 7'],
                  '2026-08-08': ['Sat', 'Aug 8'],
                  '2026-08-09': ['Sun', 'Aug 9'] },
      venues:   ['Broomfield County Commons Park', 'Aurora Sports Park'],
      hqVenues: [],
      // Transparent crest, used as the page watermark. Omit for an event
      // and the pages draw a generic shield in the accent colour instead.
      watermark: ASSETS + 'dic-crest.png',
      // 23 divisions, generated from the 203-game Assignr export.
      divisionOrder: ['U11 Boys Gold','U11 Boys Silver',
                      'U11/U12 Girls Gold','U11/U12 Girls Silver',
                      'U12 Boys Gold',
                      'U13 Boys Gold','U13 Boys Silver',
                      'U13 Girls Gold','U13 Girls Silver',
                      'U14 Boys Silver',
                      'U14 Girls Gold','U14 Girls Silver','U14 Girls Bronze',
                      'U14/U15 Boys Gold',
                      'U15 Girls Gold','U15 Girls Silver',
                      'U16 Girls Gold','U16 Girls Silver',
                      'U16/U17 Boys Gold',
                      'U17 Girls Gold',
                      'HS Boys Gold','HS Girls Gold','HS Girls Silver'],
      // Assignr carries the two referee HQs as sub-venues, not venues, so
      // they are filtered at the field level instead.
      hqFields: ['Yellow Pod - Referee HQ', 'West - Ref HQ'],
      trim:     [' County Commons Park', ' Sports Park'],
      // Field lists and game counts read off the Assignr export, not
      // typed from memory. Broomfield's address is from the Assignr
      // venue record; Aurora has none on file, so Maps resolves by name.
      venueInfo: [
        { name: 'Broomfield County Commons Park',
          fields: 'Championship Turf · Yellow Pod 01, 02, 04, 05, 06 · Blue Pod 02, 03',
          addr: '13200 Sheridan Blvd, Broomfield',
          map: '13200+Sheridan+Blvd,+Broomfield,+CO+80020', games: 129 },
        { name: 'Aurora Sports Park',
          fields: 'North 01A, 01B, 02A, 02B, 03, 04',
          addr: 'Aurora',
          map: 'Aurora+Sports+Park,+Aurora,+CO', games: 74 }
      ],
      logos:    [{ name: 'Colorado Rush', url: 'https://www.coloradorush.com/denver-international-cup',
                   src: ASSETS + 'colorado-rush.png', alt: 'Colorado Rush' },
                 { name: 'Denver International Cup',
                   src: ASSETS + 'denver-international-cup.png',
                   alt: '2026 Denver International Cup · August 7-9, 2026' }],
      alertWho: 'your site coordinator and Deanna',
      refInfo:  [
        { h: 'Your site coordinator',
          p: '<b>Broomfield</b> \u2014 Deanna Duncan-Allen, Bowen Taylor, George Lewis and Sonja Dawson Urano. <b>Aurora</b> \u2014 Tim Auth. They are at the Referee HQ tent. If it is urgent, use the red Help button.' },
        { h: 'Game cards',
          p: 'Game cards are at each field in a box, with score entry instructions. Post-game, leave the filled card in the box. Post your score here as well, and complete your game report in Assignr so you get paid.' },
        { h: 'Something wrong',
          p: 'Use the red Help button in the corner. It reaches site staff and Deanna at once.' }
      ],
      host:     { name: 'Colorado Rush', url: 'https://www.coloradorush.com/denver-international-cup' }
    }
  };

  // The first path segment. Falls back to steamboat so a page opened from
  // a bare URL still renders rather than throwing.
  // An event built from its TOURNAMENTS row, for the ones config.js has
  // never heard of.
  //
  // The picker lists what is in the SHEET, so an event Deanna adds in the
  // Command Center on Friday appears immediately. Resolution, though,
  // needed a block in THIS FILE -- so tapping Rush COS 7v7 or CSA Cups
  // found nothing, resolve() correctly refused to fall back to whatever
  // was picked last, and the referee got the picker again. It looked like
  // a dead button. Adding a tournament should never require a deploy.
  //
  // A config block is now an OVERRIDE for branding -- crest, accent,
  // watermark, day labels -- and not a requirement for the thing to work.
  function fromRow(t) {
    if (!t || !t.id) return null;
    var dates = [], d = t.startDate, guard = 0;
    while (d && t.endDate && d <= t.endDate && guard++ < 40) {
      dates.push(d);
      var x = new Date(d + 'T12:00:00'); x.setDate(x.getDate() + 1);
      var m = x.getMonth() + 1, dd = x.getDate();
      d = x.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (dd < 10 ? '0' : '') + dd;
    }
    if (!dates.length && t.startDate) dates = [t.startDate];
    var lbl = {};
    dates.forEach(function (x) {
      var dt = new Date(x + 'T12:00:00');
      lbl[x] = [['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dt.getDay()],
                ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][dt.getMonth()]
                  + ' ' + dt.getDate()];
    });
    var venues = t.venues || [];
    return {
      id: t.id, path: t.id,
      shield: String(t.name || t.id).replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase(),
      name: t.name || t.id, full: t.name || t.id,
      subtitle: t.blurb || 'Colorado Soccer Association',
      accent: t.accent || '#7FB8DE',
      hub: 'jareferee.com/ref?e=' + t.id,
      weatherPlace: venues[0] || '',
      dates: dates, daylbl: lbl, venues: venues,
      hqVenues: [], hqFields: [], trim: [], logos: [], refInfo: [],
      divisionOrder: [], adopted: true
    };
  }

  function byPath(seg) {
    seg = String(seg || '').toLowerCase();
    if (!seg) return null;
    var keys = Object.keys(EVENTS);
    for (var i = 0; i < keys.length; i++) {
      if (EVENTS[keys[i]].path === seg || EVENTS[keys[i]].id === seg) return EVENTS[keys[i]];
    }
    return null;
  }

  // Where the event came from matters. /ref/ is a front door with no
  // event of its own -- it has to KNOW it has not resolved so it can ask,
  // rather than quietly serving whichever tournament is the default.
  //
  //   query   ?e=skyline          a link, or the picker's own choice
  //   path    /skyline/           a tournament's own address
  //   stored  last picked         so a referee picks once, not every load
  //   none    /ref/               ask
  // The TOURNAMENTS row the picker stashed when it was tapped.
  function adopted(id) {
    try {
      var raw = localStorage.getItem('jar-event-row');
      if (!raw) return null;
      var row = JSON.parse(raw);
      if (!row || String(row.id).toLowerCase() !== String(id).toLowerCase()) return null;
      return fromRow(row);
    } catch (e) { return null; }
  }

  function resolve() {
    var out = { event: null, from: 'none' };
    try {
      var q = String(location.search || '').match(/[?&]e=([A-Za-z0-9_-]+)/);
      if (q) {
        var byQ = byPath(q[1]) || adopted(q[1]);
        if (byQ) return { event: byQ, from: 'query' };
        // Asked for by name and not found. Do NOT carry on down to the
        // stored choice: ?e=uchc quietly opened Arsenal, because Arsenal
        // was the last event picked on that phone. Being told the event is
        // unknown is recoverable; being shown the wrong tournament is not.
        return { event: null, from: 'unknown', asked: q[1] };
      }
      var seg = String(location.pathname || '').split('/').filter(Boolean)[0] || '';
      var byP = byPath(seg);
      if (byP) return { event: byP, from: 'path' };

      // Only trust a stored choice on a page with no event of its own,
      // and only for a day. A referee who worked Skyline on Saturday
      // should not be dropped into Skyline a fortnight later.
      var raw = localStorage.getItem('jar-event');
      if (raw) {
        var st = JSON.parse(raw);
        if (st && st.id && (Date.now() - (st.at || 0)) < 20 * 60 * 60 * 1000) {
          var byS = byPath(st.id) || adopted(st.id);
          if (byS) return { event: byS, from: 'stored' };
        }
      }
    } catch (e) { /* non-browser, or storage blocked */ }
    return out;
  }

  // No event chosen yet: a neutral statewide identity. Falling back to a
  // tournament meant /ref/ rendered the DIC crest, DIC weather and polled
  // DIC games under a heading that said Colorado Referee Hub.
  var NEUTRAL = {
    id:       '',
    path:     'ref',
    shield:   'CO',
    name:     'Colorado Referee Hub',
    full:     'Colorado Referee Hub',
    subtitle: 'Colorado Soccer Referee Program',
    accent:   '#7FB8DE',
    hub:      'jareferee.com/ref',
    weatherPlace: '',
    dates:    [], daylbl: {}, venues: [], hqVenues: [], hqFields: [],
    trim:     [], logos: [], refInfo: [],
    divisionOrder: [],
    watermark: ASSETS + 'colorado-referee-program.png',
    host:     { name: 'Colorado Soccer Referee Program', url: 'https://www.coloradoreferee.com' }
  };

  var R = resolve();
  var EVENT = R.event || NEUTRAL;

  window.JAR = {
    VERSION: '2026.08.25-b',

    // ── CREST, the rest of the programme ──
    // Taken from coloradoreferee.github.io, the site that lists every tool.
    // Not invented: the hub renders a link only when the address is set
    // here, so a guess would have 404'd in front of a first-year referee
    // rather than failing quietly.
    CREST_URL:   'https://coloradoreferee.github.io',
    LIBRARY_URL: 'https://coloradoreferee.github.io/CREST_Reference',
    ACADEMY_URL: 'https://coloradoreferee.github.io/CREST_Academy',
    CSA_URL:     'https://www.coloradosoccer.org',

    // False on /ref/ with nothing chosen yet. The hub shows its picker
    // rather than guessing, which is the whole point of a front door.
    resolved: !!R.event,
    resolvedFrom: R.from,

    // Remember a choice, then reload so every page picks it up the same
    // way it would from a path. One code path, not two.
    // row is the TOURNAMENTS record the picker was showing. Stored so an
    // event with no config block can still be opened, and so a hard reload
    // on ?e=rushcos resolves without another round trip.
    setEvent: function (id, reload, row) {
      try {
        localStorage.setItem('jar-event', JSON.stringify({ id: String(id), at: Date.now() }));
        if (row && row.id) localStorage.setItem('jar-event-row', JSON.stringify(row));
      } catch (e) {}
      if (reload !== false) {
        var base = String(location.pathname || '');
        location.href = base + '?e=' + encodeURIComponent(id);
      }
    },

    forgetEvent: function () {
      try {
        localStorage.removeItem('jar-event');
        localStorage.removeItem('jar-event-row');
      } catch (e) {}
    },
    fromRow: fromRow,
    BACKEND: BACKEND,
    ASSETS:  ASSETS,
    HOUSE:   HOUSE,
    EVENTS:  EVENTS,
    EVENT:   EVENT,

    // Event id as the backend knows it. Matches TOURNAMENTS.ID and the
    // EVENT column in ROSTERS. This is the string to send in any request
    // that needs to name the tournament.
    id: EVENT.id,

    // Shorten a venue name for a phone header.
    short: function (v) {
      var s = String(v == null ? '' : v);
      (EVENT.trim || []).forEach(function (t) { s = s.split(t).join(''); });
      return s.trim() || String(v || '');
    },

    // True if this venue or field is a referee HQ rather than a pitch.
    isHq: function (venue, field) {
      var v = String(venue || ''), f = String(field || '');
      if ((EVENT.hqVenues || []).indexOf(v) >= 0) return true;
      return (EVENT.hqFields || []).indexOf(f) >= 0;
    },

    // Playing venues only, for a card or score picker.
    playVenues: function () {
      var hq = EVENT.hqVenues || [];
      return (EVENT.venues || []).filter(function (v) { return hq.indexOf(v) < 0; });
    },

    // "Fri Aug 7" for a one-line label, or ['Fri','Aug 7'] via .daylbl.
    dayLabel: function (d) {
      var p = (EVENT.daylbl || {})[d];
      return p ? (p[0] + ' ' + p[1]) : String(d || '');
    },

    // Paint the title, shield and accent without every page repeating it.
    applyBrand: function () {
      try {
        document.title = EVENT.full;
        var r = document.documentElement;
        if (r && r.style && EVENT.accent) r.style.setProperty('--accent', EVENT.accent);
        var nodes = document.querySelectorAll('[data-jar]');
        Array.prototype.forEach.call(nodes, function (el) {
          var key = el.getAttribute('data-jar');
          if (key && EVENT[key] != null) el.textContent = EVENT[key];
        });
      } catch (e) { /* never let branding break a page */ }
    }
  };

  // Exported for node-based checks. Harmless in a browser.
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EVENTS: EVENTS, resolve: resolve };
  }
})();
