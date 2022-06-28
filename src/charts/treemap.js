import * as d3 from 'd3'

export default function treemap(second) {
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

    const my = (selection) => {

        const { width, height, margin } = dimensions
        const { left, right, top, bottom } = margin

        x.range([0, width])
        y.range([0, height])

        root.sort((a, b) => a.value < b.value ? 1 : -1)

        let leaves = root.descendants()

        // Compute the treemap layout.
        d3.treemap()
            .tile(d3.treemapBinary)
            .size([width, height])
            .paddingOuter(3)
            .paddingInner(1)
            .paddingTop(28)
            .round(true)
            (root);

        // filter out the leaves that are not in the current frame
        leaves = leaves.filter(d => {
            let [minX, maxX] = x.domain()
            let [minY, maxY] = y.domain()
            return (d.x0 >= minX && d.x1 <= maxX) && (d.y0 >= minY && d.y1 <= maxY)
        })

        const svg = selection
            .attr("viewBox", [0, -top, width + right, height + top + bottom])
            .attr("width", width)
            .attr("height", height)
            .attr("font-family", "sans-serif")
            .attr("font-size", 14)
            .selectAll('g')
            .data([null])
            .join('g')
            .attr('class', 'treemapg')

        const node = svg.selectAll("g")
            .data(leaves)
            .join("g")
            .attr('class', 'treemapRectG')
            .attr("transform", d => d === treemapRoot ? 'translate(0,-5)' : `translate(${x(d.x0)},${y(d.y0)})`)
            .style('cursor', d => d.children || d._children ? 'pointer' : 'default')

        node.append("rect")
            .attr("fill", d => d === treemapRoot ? '#ccc' : colorScale(d.value))
            .attr("fill-opacity", 0.9)
            .attr("stroke", '#555')
            .attr("stroke-width", 1.5)
            .attr("stroke-opacity", 0.7)
            .attr("stroke-linejoin", 'round')
            .attr("width", d => d === treemapRoot ? width : x(d.x1) - x(d.x0))
            .attr("height", d => d === treemapRoot ? 30 : y(d.y1) - y(d.y0))
            // .attr('visibility', d => (d !== treemapRoot && d.children) ? 'hidden' : 'visible')
            .on('click', (_, d) => d === treemapRoot ? zoomout(_, d) : zoomin(_, d))
            .on('mouseover', hover)
            .on('mouseout', exit)


        node.append("title").text(d =>
            d.ancestors()
                .reverse()
                .slice(1)
                .reduce((acc, curr, i) => {
                    return acc + '\n' + Array(i + 1).fill('\t').reduce((a, c) => a + c, '') + curr.data.name
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
            // .attr('visibility', d => (d !== treemapRoot && d.children) ? 'hidden' : 'visible')
            .attr("clip-path", (d, i) => `url(${new URL(`#${uid}-clip-${i}`, location)})`)
            .attr('fill', d => d === treemapRoot || (d.value / colorScale.domain().at(1)) < 0.6 ? 'black' : 'white') // if root or color is lighter, make text black. Else, make text white
            .selectAll("tspan")
            .data((d, i) => {
                if(d === treemapRoot) {
                    return [d.ancestors().map(d => d.data.name).reverse().join('/')]
                } else if(d.children) {
                    return [`${d.data.name} ${format(d.value)}`]
                } else {
                    return `${d.data.name}\n${format(d.value)}`.split(/\n/g)
                }
            })
            .join("tspan")
            .attr("x", 3)
            .attr("y", (d, i, D) => `${(i === D.length - 1) * 0.3 + 1.1 + i * 0.9}em`)
            .attr("fill-opacity", (d, i, D) => i === D.length - 1 ? 0.7 : null)
            .text(d => d)
            .style('pointer-events', 'none')

        function zoomin(_, d) {

            // if there is no ancestor one depth lower, just zoom directly to the clicked node
            const topLevelParent = d.ancestors().find(a => a.depth == depth + 1) || d

            if (topLevelParent.children || topLevelParent._children) {
                // set current depth to the depth we are zooming to
                depth = topLevelParent.depth

                x.domain([topLevelParent.x0, topLevelParent.x1])
                y.domain([topLevelParent.y0, topLevelParent.y1])

                treemapRoot = topLevelParent
            }
            if(topLevelParent._children) {
                //toggle
                d.children = d._children
                d._children = null

                nodelinkSelection.call(nodelink.source(topLevelParent))
            } else {
                nodelinkSelection.call(nodelink)
            }

            selection.call(my)

        }

        function zoomout(_, d) {

            const parent = d && d.parent

            if (parent) {
                // set current depth to the depth we are zooming to
                depth = parent.depth

                x.domain([parent.x0, parent.x1])
                y.domain([parent.y0, parent.y1])

                treemapRoot = parent

                // collapse siblings
                parent.children.forEach(c => collapse(c));

                // update
                selection.call(my)
                nodelinkSelection.call(nodelink.source(d)) // and update source of change
            }
        }

    }

    function collapse(node) {
        if (node.children) {
            node._children = node.children
            node.children = null
            node._children.forEach(c => collapse(c))
        }
    }


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