// Grafico dei commit in stile `git log --graph`, disegnato in SVG accanto a un elenco HTML.
// Le posizioni verticali si misurano dal DOM, così le righe possono avere altezze diverse.
(function () {
  'use strict';

  var SVG_NS = 'http://www.w3.org/2000/svg';
  var LANE_COLORS = 5; // --lane-0 … --lane-4 in style.css

  var tagId = function (tag) {
    return 'versione-' + String(tag).replace(/^v/, '').replace(/[^\w-]+/g, '-');
  };
  var laneColor = function (lane) {
    return 'var(--lane-' + Math.min(lane, LANE_COLORS - 1) + ')';
  };
  var esc = function (t) {
    return String(t == null ? '' : t)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  };

  // FNV-1a: sempre lo stesso hash finto per lo stesso commit
  function fakeHash(text) {
    var h = 0x811c9dc5;
    for (var i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return ('0000000' + (h >>> 0).toString(16)).slice(-8).slice(0, 7);
  }

  /** Ricostruisce genitori, corsie ed etichette a partire dall'elenco cronologico dei commit. */
  function buildModel(commits, opts) {
    opts = opts || {};
    var mainBranch = opts.mainBranch || 'main';
    var branchLanes = opts.branchLanes || {};
    var head = {};

    var nodes = commits.map(function (c, index) {
      var parents = [];
      var isBranchStart = false;
      if (head[c.branch] !== undefined) {
        parents.push(head[c.branch]);
      } else if (c.branch !== mainBranch) {
        var from = c.from || mainBranch;
        if (head[from] !== undefined) {
          parents.push(head[from]);
          isBranchStart = true;
        }
      }
      if (c.merge) {
        if (head[c.merge] === undefined) console.warn('[versioni] «' + c.merge + '» non ha commit prima del merge', c);
        else parents.push(head[c.merge]);
      }
      head[c.branch] = index;
      return Object.assign({}, c, {
        index: index,
        parents: parents,
        isBranchStart: isBranchStart,
        isMerge: parents.length > 1,
        hash: c.hash || fakeHash(index + '|' + c.branch + '|' + c.message),
      });
    });

    // Righe occupate da ogni branch: dal punto di partenza al merge.
    var spans = {};
    var order = [];
    nodes.forEach(function (n) {
      if (!spans[n.branch]) {
        spans[n.branch] = { start: n.isBranchStart ? n.parents[0] : n.index, end: n.index, first: n.index };
        order.push(n.branch);
      }
      spans[n.branch].end = Math.max(spans[n.branch].end, n.index);
      if (n.merge && spans[n.merge]) spans[n.merge].end = Math.max(spans[n.merge].end, n.index);
    });

    // Ogni branch prende la prima corsia libera (la 0 è sempre del branch principale).
    var laneOf = {};
    laneOf[mainBranch] = 0;
    var laneEnd = [Infinity];
    order
      .filter(function (b) {
        return b !== mainBranch;
      })
      .sort(function (a, b) {
        return spans[a].start - spans[b].start || spans[a].first - spans[b].first;
      })
      .forEach(function (branch) {
        var span = spans[branch];
        var lane = branchLanes[branch];
        if (lane == null) {
          lane = 1;
          while (laneEnd[lane] !== undefined && laneEnd[lane] > span.start) lane++;
        }
        laneOf[branch] = lane;
        laneEnd[lane] = Math.max(laneEnd[lane] === undefined ? -1 : laneEnd[lane], span.end);
      });

    // Etichetta del branch sull'ultimo commit di ciascuno, come le decorazioni di git.
    var lastOf = {};
    nodes.forEach(function (n) {
      lastOf[n.branch] = n.index;
    });
    nodes.forEach(function (n) {
      n.lane = laneOf[n.branch] || 0;
      n.heads = Object.keys(lastOf).filter(function (b) {
        return lastOf[b] === n.index;
      });
    });

    return {
      nodes: nodes,
      lanes: Math.max.apply(null, nodes.map(function (n) {
        return n.lane;
      })) + 1,
      tags: nodes.filter(function (n) {
        return n.tag;
      }),
      branches: order,
      mainBranch: mainBranch,
    };
  }

  function rowHtml(n, mainBranch) {
    var refs =
      (n.tag ? '<span class="ref ref--tag">' + esc(n.tag) + '</span>' : '') +
      n.heads
        .map(function (b) {
          return '<span class="ref ref--branch" style="--c:' + laneColor(n.lane) + '">' + esc(b) + '</span>';
        })
        .join('');
    var notes =
      n.tag && n.notes && n.notes.length
        ? '<ul class="gg__notes">' + n.notes.map(function (t) {
            return '<li>' + esc(t) + '</li>';
          }).join('') + '</ul>'
        : '';
    return (
      '<li class="gg__row' + (n.tag ? ' is-tag' : '') + '" data-index="' + n.index + '"' +
      (n.tag ? ' id="' + tagId(n.tag) + '"' : '') + '>' +
      '<div class="gg__main"><div class="gg__line">' +
      '<span class="gg__hash">' + esc(n.hash) + '</span>' +
      '<span class="gg__msg">' + (refs ? '<span class="gg__refs">' + refs + '</span>' : '') +
      '<span class="gg__text">' + esc(n.message) + '</span></span>' +
      '</div>' + notes + '</div></li>'
    );
  }

  function circle(cx, cy, r, className) {
    var c = document.createElementNS(SVG_NS, 'circle');
    c.setAttribute('cx', cx);
    c.setAttribute('cy', cy);
    c.setAttribute('r', r);
    c.setAttribute('class', className);
    return c;
  }

  /**
   * Disegna il grafico dentro `container`.
   * Restituisce le righe (dal commit più recente), `layout()` per ridisegnare e `draw(index)` per l'animazione.
   */
  function renderGraph(container, model, opts) {
    opts = opts || {};
    var laneWidth = opts.laneWidth || 22;
    var nodes = model.nodes;
    var rail = Math.round(model.lanes * laneWidth + laneWidth * 0.8);
    var x = function (lane) {
      return laneWidth * 0.9 + lane * laneWidth;
    };

    // Anche sul genitore, così l'intestazione delle colonne si allinea al grafico.
    container.style.setProperty('--rail', rail + 'px');
    if (container.parentElement) container.parentElement.style.setProperty('--rail', rail + 'px');
    container.innerHTML =
      '<svg class="gg__svg" aria-hidden="true"><g class="gg__edges"></g><g class="gg__nodes"></g></svg>' +
      '<ol class="gg__rows">' + nodes.slice().reverse().map(function (n) {
        return rowHtml(n, model.mainBranch);
      }).join('') + '</ol>';

    var svg = container.querySelector('.gg__svg');
    var edgesLayer = svg.querySelector('.gg__edges');
    var nodesLayer = svg.querySelector('.gg__nodes');
    var rows = Array.prototype.slice.call(container.querySelectorAll('.gg__row'));
    var rowByIndex = {};
    rows.forEach(function (r) {
      rowByIndex[r.getAttribute('data-index')] = r;
    });
    var drawn = {};
    var edgeEls = {};
    var nodeEls = {};

    var mark = function (index) {
      if (rowByIndex[index]) rowByIndex[index].classList.add('is-drawn');
      if (nodeEls[index]) nodeEls[index].classList.add('is-drawn');
      (edgeEls[index] || []).forEach(function (p) {
        p.classList.add('is-drawn');
      });
    };

    var layout = function () {
      var top = container.getBoundingClientRect().top;
      var y = {};
      rows.forEach(function (row) {
        var box = row.querySelector('.gg__line').getBoundingClientRect();
        y[row.getAttribute('data-index')] = Math.round(box.top - top + box.height / 2);
      });

      svg.setAttribute('width', rail);
      svg.setAttribute('height', container.offsetHeight);
      edgesLayer.textContent = '';
      nodesLayer.textContent = '';
      edgeEls = {};
      nodeEls = {};

      nodes.forEach(function (n) {
        var xc = x(n.lane);
        var yc = y[n.index];
        edgeEls[n.index] = n.parents.map(function (p, k) {
          var parent = nodes[p];
          var xp = x(parent.lane);
          var yp = y[p];
          var lane = n.lane;
          var dy = Math.min(Math.max(Math.abs(xc - xp) * 1.4, 26), yp - yc);
          var d;
          if (xc === xp) {
            d = 'M' + xc + ' ' + yc + 'V' + yp;
          } else if (k === 0 && n.isBranchStart) {
            // Il branch nasce: scende nella sua corsia e curva verso il commit di partenza.
            var y0 = yp - dy;
            d = 'M' + xc + ' ' + yc + 'V' + y0 + 'C' + xc + ' ' + (y0 + dy * 0.55) + ' ' + xp + ' ' + (yp - dy * 0.45) + ' ' + xp + ' ' + yp;
          } else {
            // Merge: dal commit di merge curva verso la corsia del branch unito.
            var y1 = yc + dy;
            d = 'M' + xc + ' ' + yc + 'C' + xc + ' ' + (yc + dy * 0.45) + ' ' + xp + ' ' + (y1 - dy * 0.55) + ' ' + xp + ' ' + y1 + 'V' + yp;
            lane = parent.lane;
          }
          var path = document.createElementNS(SVG_NS, 'path');
          path.setAttribute('d', d);
          path.setAttribute('pathLength', '1');
          path.setAttribute('class', 'gg__edge');
          path.style.stroke = laneColor(lane);
          edgesLayer.appendChild(path);
          return path;
        });

        var g = document.createElementNS(SVG_NS, 'g');
        g.setAttribute('class', 'gg__node' + (n.tag ? ' is-tag' : '') + (n.isMerge ? ' is-merge' : ''));
        g.style.color = laneColor(n.lane);
        if (n.tag) g.appendChild(circle(xc, yc, 11, 'gg__node-ring'));
        g.appendChild(circle(xc, yc, n.tag ? 6.5 : 5, 'gg__node-core'));
        nodesLayer.appendChild(g);
        nodeEls[n.index] = g;
      });

      Object.keys(drawn).forEach(mark);
    };

    var draw = function (index) {
      drawn[index] = true;
      mark(index);
    };
    var highlight = function (index, on) {
      if (nodeEls[index]) nodeEls[index].classList.toggle('is-hover', on);
    };

    layout();
    return { rows: rows, layout: layout, draw: draw, highlight: highlight };
  }

  window.AriGitGraph = { buildModel: buildModel, renderGraph: renderGraph, tagId: tagId };
})();
