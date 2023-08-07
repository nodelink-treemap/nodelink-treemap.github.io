import * as d3 from 'd3'

/**
 * treemap() is a chart based on the Mike Bostock's towards reusable charts paradigm.
 * 
 * In typical d3 style, we chain attribute and instance methods to produce an updatable,
 * persistant chart. 
 */
export default function treemap() {
    let root,
        dimensions,
        hover,
        exit,
        x = d3.scaleLinear(),
        y = d3.scaleLinear(),
        depth = 0,
        treemapRoot,
        nodelink,
        nodelinkSelection,
        colorScale,
        format = d3.format(',')

    /**
     *  my will be called on every update and render.
     */
    const my = (selection) => {

        const { width, height, margin } = dimensions
        const { left, right, top, bottom } = margin

        x.range([0, width])
        y.range([0, height])

        root.sort((a, b) => a.value < b.value ? 1 : -1)

        let descendants = root.descendants()

        // Compute the treemap layout.
        d3.treemap()
            .tile(d3.treemapBinary)
            .size([width, height])
            .paddingOuter(3)
            .paddingInner(1)
            .paddingTop(28)
            .round(true)
            (root);

        // filter out the descendants that are not in the current frame
        descendants = descendants.filter(d => {
            let [minX, maxX] = x.domain()
            let [minY, maxY] = y.domain()
            return (d.x0 >= minX && d.x1 <= maxX) && (d.y0 >= minY && d.y1 <= maxY)
        })

        /*
         *  We grab the selection and join a new group to it.
         */
        const svg = selection
            .attr("viewBox", [0, -top, width + right, height + top + bottom])
            .attr("width", width)
            .attr("height", height)
            .attr("font-family", "sans-serif")
            .attr("font-size", 20)
            .selectAll('g')
            .data([null])
            .join('g')
            .attr('class', 'treemapg')

        const node = svg.selectAll("g")
            .data(descendants)
            .join("g")
            .attr('class', 'treemapRectG')
            .attr("transform", d => d === treemapRoot ? 'translate(0,-5)' : `translate(${x(d.x0)},${y(d.y0)})`)
            .style('cursor', d => d.children || d._children ? 'pointer' : 'default')
            .on('mouseover', (e) => {
              setTspanVisibility(e.target.parentNode, 'visible')
            })
            .on('mouseout', (e) => {
              setTspanVisibility(e.target.parentNode, 'hidden')
            })

        node.append("rect")
            .attr("fill", d => d === treemapRoot ? '#ccc' : colorScale(d.value))
            .attr("fill-opacity", 0.9)
            .attr("stroke", '#555')
            .attr("stroke-width", 1.5)
            .attr("stroke-opacity", 0.7)
            .attr("stroke-linejoin", 'round')
            .attr("width", d => d === treemapRoot ? width : x(d.x1) - x(d.x0))
            .attr("height", d => d === treemapRoot ? 30 : y(d.y1) - y(d.y0))
            
            // if this node is the root, we should zoom out, otherwise we zoom in
            .on('click', (_, d) => d === treemapRoot ? zoomout(_, d) : zoomin(_, d))
            .on('mouseover', hover)
            .on('mouseout', exit)

        // We append a title showing the node and its ancestors
        node.append("title").text(d =>
            d.ancestors()
                .reverse()
                .slice(1)
                // For each ancestor, we should indent each ancestor one more than the last.
                .reduce((acc, curr, i) => {
                    /**
                     *  We append a new line to the acc
                     *  then we add i+1 tabs,
                     *  then we add the name
                     */
                    let indent = '\t';
                    while(i-- > 0)
                      indent += '\t'

                    return acc + '\n' + indent + curr.data.name
                }, root.data.name)
        );

        // A unique identifier for clip paths (to avoid conflicts).
        const uid = `O-${Math.random().toString(16).slice(2)}`

        node.append("clipPath")
            .attr("id", (d, i) => `${uid}-clip-${i}`)
            .append("rect")
            .attr("width", d => x(d.x1) - x(d.x0))
            .attr("height", d => y(d.y1) - y(d.y0))

        node.append("text")
            .attr("x", 3)
            .attr("y", "1.1em")
            .attr("clip-path", (d, i) => `url(${new URL(`#${uid}-clip-${i}`, location)})`)
            
            // if root or color is lighter, make text black. Else, make text white
            .attr('fill', d => d === treemapRoot || (d.value / colorScale.domain().at(1)) < 0.6 ? 'black' : 'white') 
            .selectAll("tspan")
            // The data function binds the array of text provided below
            .data((d, i) => {
                if(d === treemapRoot) {
                    // if the root, we should show the current root and the path of it's ancestors (eg. for square: shape/rectangle/square)
                    return [d.ancestors().map(d => d.data.name).reverse().join('/')]
                } else {
                    // otherwise we should place the two strings on their own lines
                    return `${d.data.name}\n ${format(d.value)}`.split(/\n/g)
                }
            })
            .join("tspan")
            .attr("fill-opacity", (d, i, D) => i === D.length - 1 ? 0.7 : null)
            .attr('visibility', (_, i) => i === 1 ? 'hidden' : 'visible')
            .text(d => d)
            .style('pointer-events', 'none')

        /**
         *  Function zoomin will zoom to the clicked node on the tree. We update the root to 
         *  reflect this.
         *
         *  NOTE: We only jump to the next level (one child below). Therefore we must 
         *  compute the next node to zoom to. 
         */
        function zoomin(_, d) {
            // if there is a node between the current root and the selected node 
            // (meaning there is a parent we should zoom to first), then we zoom the that parent
            // otherwise, we should zoom to the selected node.
            const topLevelParent = d.ancestors().find(a => a.depth == depth + 1) || d

            if (topLevelParent.children || topLevelParent._children) {
                // set current depth to the depth we are zooming to
                depth = topLevelParent.depth

                x.domain([topLevelParent.x0, topLevelParent.x1])
                y.domain([topLevelParent.y0, topLevelParent.y1])

                treemapRoot = topLevelParent
            }

            // if there are collapsed children, we show them. Then we re-render regardless
            if(topLevelParent._children) {
                //toggle
                d.children = d._children
                d._children = null
            }

            topLevelParent.children.forEach(c => {
              if(c._children) {
                c.children = c._children
                c._children = null
              }
              c.children?.forEach(cc => collapse(cc))
            })

            if(nodelinkSelection) {
              nodelinkSelection.call(nodelink.source(topLevelParent))
            }
            // we trigger a re-render
            selection.call(my)
        }


        /**
         *  Function zoomout will zoom the treemap to the parent's level.
         *  As a side-effect we collapse all of the parent's children to provide a reasonable
         *  view of the treemap.   
         */
        function zoomout(_, d) {
            const parent = d && d.parent

            if (parent) {
                // set current depth to the depth we are zooming to
                depth = parent.depth

                x.domain([parent.x0, parent.x1])
                y.domain([parent.y0, parent.y1])

                treemapRoot = parent

                // collapse siblings
                parent.children.forEach(c => {
                  if(c._children) {
                    c.children = c._children
                    c._children = null
                  }
                  c.children?.forEach(cc => collapse(cc))
                })

                // update
                selection.call(my)
                if(nodelink && nodelinkSelection) {
                  nodelinkSelection.call(nodelink.source(d)) // and update source of change
                }
            }
        }
    }
    

    /**
     * If the selected node has children, we collapse them by placing the children in _children
     * to hide them. This is done recursively to childrens' children. 
     */
    function collapse(node) {
        if (node.children) {
            node._children = node.children
            node.children = null
            node._children.forEach(c => collapse(c))
        }
    }

    /**
     * The following are getter/setter functions (depending on the number of arguments).
     * 
     * Note that at the end of setter functions we return my to allow for chaining. 
     */
    my.root = function (_) {
        return arguments.length ? (root = _, my) : root
    }
    my.dimensions = function (_) {
        if(arguments.length) {
            dimensions = _
            x.domain([0, _.width])
            y.domain([0, _.height])
            return my
        } else {
            return dimensions
        }
    }
    my.hover = function (_) {
        return arguments.length ? (hover = _, my) : hover
    }
    my.exit = function (_) {
        return arguments.length ? (exit = _, my) : exit
    }
    my.treemapRoot = function (_) {
        return arguments.length ? (treemapRoot = _, my) : treemapRoot
    }
    my.nodelink = function (_) {
        return arguments.length ? (nodelink = _, my) : nodelink
    }
    my.nodelinkSelection = function (_) {
        return arguments.length ? (nodelinkSelection = _, my) : nodelinkSelection
    }
    my.colorScale = function (_) {
        return arguments.length ? (colorScale = _, my) : colorScale
    }
    my.format = function (_) {
        return arguments.length ? (format = _, my) : format
    }

    return my
}

/**
  * This function will set the visibility of the second tspan to the given visibility.
  * This is used to show/hide the numeric label of the node when the node is hovered.
  */
function setTspanVisibility(query, visibility) {
  let g = d3.select(query)
  let tspans = g.selectAll('tspan')
  if(tspans.size() > 1) {
    tspans.filter((_, i) => i === 1)
      .attr('visibility', visibility)
  }
}
