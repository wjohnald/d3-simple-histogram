# Simple Histogram

This class will consume data and plot a simple SVG histogram.

### What does simple mean?

This histogram will **always** create ten equal size bins for the supplied data.
It will automagically compute the maximum x-value and y-value of the chart based
on the supplied data.

### Is that it?

Nope. Once nice touch is that you can **zoom** a particular bin by clicking on it.
The chart will automatically split the bin into ten equal size bins that cover the
range of the previous bin. The columns will update accordingly. To zoom out again,
just click anywhere else on the screen.

![Screenshot](/chart-picture.png)

# Dependencies

* d3

# Usage

```javascript

var data = [
  { x_value: 1, y_value: 20 },
  { x_value: 2, y_value: 3  },
  { x_value: 3, y_value: 17 },
  { x_value: 4, y_value: 50 },
  { x_value: 5, y_value: 43 },
  { x_value: 6, y_value: 34 },
  { x_value: 7, y_value: 11 },
  { x_value: 8, y_value: 1  },
  ...
];

var accessor = function(data) {
  return data.y_value;
};

new window.Histogram({
  container: '#histogram-wrapper',
  accessor: accessor,
  margin: {
    top: 10,
    right: 30,
    bottom: 50,
    left: 30,
    xTitle: 30,
    yTitle: 30,
    chartTitle: 30
  },
  xTitle: 'number of y-values (' + d3.sum(d, accessor) + ' total)',
  yTitle: 'number of x-values (' + d.length + ' total)',
  chartTitle: 'Number of X-Values vs. Number of Y-Values'
}).updateData(data).render();

```
