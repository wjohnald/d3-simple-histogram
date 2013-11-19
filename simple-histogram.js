(function(globalContext) {

  var Histogram = function(options) {
    this.options = options;
    this.options.accessor = options.accessor || function(d) { return d; };

    // INIT DATA CONTAINERS
    this.data = [];
    this.layoutData = this.getDefaultLayoutData();
    this.x = d3.scale.linear();
    this.y = d3.scale.linear();
    this.histo = d3.layout.histogram();

    if (options.accessor) {
      this.histo.value(this.options.accessor);
    }

    this.container = options.container || '#main';
    this.margin = options.margin || {
      top:        10,
      right:      30,
      bottom:     50,
      left:       30,
      xTitle:     30,
      yTitle:     30,
      chartTitle: 30
    };

    // INIT ALL THE SVGs
    this.svg = d3.select(this.container).append('svg');

    var self = this;

    this.chartTitleWrapper = this.svg.append('g').attr({
      'class': 'chart-title',
      'transform': 'translate(' + (self.margin.left + self.margin.yTitle) + ',' + self.margin.chartTitle + ')'
    });

    this.chartTitle = this.chartTitleWrapper.append('text')
      .attr({
        'text-anchor': 'left'
      })
      .text(options.chartTitle || '');

    this.yAxisTitleWrapper = this.svg.append('g').attr({
      'class': 'y-axis-title',
      'transform': 'translate(' + self.margin.left + ',' + self.getHeight() + ') rotate(270)'
    });

    this.yAxisTitle = this.yAxisTitleWrapper.append('text')
      .attr({
        'text-anchor': 'right'
      })
      .text(options.yTitle || '');

    this.chart = this.svg.append('g').attr({
      'transform': 'translate(' + (self.margin.left + self.margin.yTitle)  + ',' + (self.margin.top + self.margin.chartTitle) + ')'
    });

    this.bars = this.chart.selectAll('.bar')
      .data(this.layoutData)
      .enter().append('g').attr({
        'class': 'bar',
        'x': 0
      });

    var height = this.getHeight();
    this.rects = this.bars.append('rect').data(this.layoutData).attr({
      'width': 0,
      'height': 0,
      'y': height,
      'x': 1
    });

    this.labels = this.bars.append('text').data(this.layoutData).attr({
      'class': 'bar-label',
      'text-anchor': 'middle'
    });

    this.xAxisWrapper = this.chart.append('g').attr({
      'class': 'x axis'
    });

    this.xAxis = d3.svg.axis().scale(this.x).orient('bottom');

    this.xAxisTitleWrapper = this.chart.append('g').attr({
      'class': 'x-axis-title'
    });

    this.xAxisTitle = this.xAxisTitleWrapper.append('text')
      .attr({
        'text-anchor': 'right'
      })
      .text(options.xTitle || '');

    d3.select(window).on('resize', function() {
      self.render();
    });

    d3.select(this.container).on('click', function() {
      self.zoomData({});
    });

    this.bars.on('click', function(d) {
      if (d.dx >= 10) {
        self.zoomData({
          minX: d.x,
          maxX: d.x + d.dx
        });
      }

      d3.event.stopPropagation();
    });

    return this;
  };

  Histogram.prototype.getDefaultLayoutData = function() {
    var d = [];

    for (var i = 0; i < 10; i++) {
      d.push({
        x: 0,
        dx: 0,
        y: 0
      });
    }

    return d;
  };

  Histogram.prototype.getWidth = function() {
    return $(this.container).width() - this.margin.left - this.margin.right - this.margin.yTitle;
  };

  Histogram.prototype.getHeight = function() {
    return $(this.container).height() - this.margin.chartTitle - this.margin.top - this.margin.bottom - this.margin.xTitle;
  };

  Histogram.prototype.getIntMagnitude = function(i) {
    var mag = 10;

    while ((i / mag) > 10) {
      mag *= 10;
    }

    return mag;
  };

  Histogram.prototype.getMaxX = function(d) {
    var max = d3.max(d, this.options.accessor) + 1; // +1 because otherwise this algorithm isn't inclusive

    var mag = this.getIntMagnitude(max);
    var mult = Math.ceil(max / mag);

    while ((10 % mult) !== 0) {
      mult++;
    }

    return mult * mag;
  };

  Histogram.prototype.getMaxY = function() {
    var max = d3.max(this.layoutData, function(d) {
      return d.y;
    });

    return max + (max / 4); // 1/4th of the max should be a nice bit of padding for the top of the graph
  };

  Histogram.prototype.updateLayoutData = function() {
    var range = this.x.domain();

    this.histo.bins(this.x.ticks()).range([range[0], range[1] - 1]);
    this.layoutData = this.histo(this.data);
  };

  Histogram.prototype.updateData = function(d) {
    this.data = d;

    var width = this.getWidth();
    var height = this.getHeight();
    var maxX = this.getMaxX(this.data);

    this.x.domain([0, maxX]);

    this.updateLayoutData();

    var maxY = this.getMaxY();
    this.y.domain([0, maxY]);

    this.updateDataBindings();

    return this;
  };

  Histogram.prototype.zoomData = function(args) {
    var minX = args.minX || 0;
    var maxX = args.maxX || this.getMaxX(this.data);

    this.x.domain([minX, maxX]);
    this.updateLayoutData();
    var maxY = this.getMaxY();
    this.y.domain([0, maxY]);

    this.updateDataBindings();

    this.render();

    return this;
  };

  Histogram.prototype.updateDataBindings = function() {
    this.bars.data(this.layoutData);
    this.rects.data(this.layoutData);
    this.labels.data(this.layoutData);

    return this;
  };

  Histogram.prototype.renderSvg = function() {
    var $container = $(this.options.container);

    this.svg.attr({
      width: $container.width(),
      height: $container.height()
    });

    return this;
  };

  Histogram.prototype.renderBars = function() {

    var self = this;
    this.bars.attr({
      'transform': function(d) {
        return 'translate(' + self.x(d.x) + ',0)';
      }
    });

    return this;
  };

  Histogram.prototype.renderRects = function() {

    if (!this.count) {
      this.count = 0;
    }

    var height = this.getHeight();
    var self = this;

    var width = this.getWidth();
    var rectWidth = (width / 10) - 1;

    this.rects
      .transition()
      .delay(function(d, i) {
        return i * 20;
      })
      .attr({
        'width': rectWidth,
        'y': function(d) {
          return height - self.y(d.y);
        },
        'height': function(d) {
          return self.y(d.y);
        }
      });

    this.count++;

    return this;
  };

  Histogram.prototype.renderLabels = function() {
    var self = this;
    var height = this.getHeight();
    var width = this.getWidth();
    var centerX = ((width / 10) - 1) / 2;

    this.labels
      .transition()
      .delay(function(d, i) {
        return i * 20;
      })
      .attr({
        'x': centerX,
        'y': function(d) {
          return height - self.y(d.y) - 6;
        }
      }).text(function(d) {
        if ((d.x === 0) && (d.dx === 1)) {
          return 'N/A';
        }
        return(d.y);
      });

    return this;
  };

  Histogram.prototype.renderXAxis = function() {

    var height = this.getHeight();
    var self = this;

    this.xAxisWrapper.attr({
      'transform': 'translate(0,' + height + ')'
    })
    .call(this.xAxis);

    this.xAxisTitleWrapper.attr({
      'transform': 'translate(0,' + (height + self.margin.bottom) + ')'
    });

    return this;
  };

  Histogram.prototype.render = function(d) {

    var width = this.getWidth();
    this.x.range([0, width]);

    var height = this.getHeight();
    this.y.range([0, height]);

    var self = this;
    this.yAxisTitleWrapper.attr({
      'transform': 'translate(' + self.margin.left + ',' + self.getHeight() + ') rotate(270)'
    });

    this.renderSvg();
    this.renderBars();
    this.renderRects();
    this.renderLabels();
    this.renderXAxis();

    return this;
  };

  globalContext.Histogram = Histogram;
})(window);
