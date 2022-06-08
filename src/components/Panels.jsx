import { useRef, useState, useEffect, useReducer } from 'react'

import * as d3 from 'd3'

import './panels.css'

export default function Panels({ data, value }) {

    const nodelinkRef = useRef(null)
    const treemapRef = useRef(null)

    const chartDimensions = {
        width: window.innerWidth / 2,
        height: window.innerHeight - 70,
        margin: {
            top: 20,
            right: 20,
            bottom: 20,
            left: 20
        }
    }
    let { width, height, margin } = chartDimensions
    const { top, right, left, bottom } = margin

    // for generating node ids
    let i = -1

    // for tracking current root
    const [root, setRoot] = useState()

    // for tracking the current state of zoom in the treemap
    let depth = 0

    const x = d3.scaleLinear().domain([0, width]).range([0, width])
    const y = d3.scaleLinear().domain([0, height]).range([0, height])

    // when data changes, update root
    useEffect(() => {
        if (!data) return
        const _root = d3.hierarchy(data)

        _root.sort((a, b) => a.data.name.localeCompare(b.data.name))
        _root.sum(d => value(d) === undefined ? 0 : value(d))

        setRoot(_root)

        // clear previous state
        let nodelinkRefElement = d3.select(nodelinkRef.current)
        nodelinkRefElement.selectAll('*').remove()

        let treemapRefElement = d3.select(treemapRef.current)
        treemapRefElement.selectAll('*').remove()

    }, [data])

    useEffect(() => {

        if (!root) return

        root.children.forEach(c => collapse(c))

        updateNodelink(root, root)
        updateTreemap(root, root)

    }, [root])

    function collapse(node) {
        if (node.children) {
            node._children = node.children
            node.children = null
            node._children.forEach(c => collapse(c))
        }
    }

    function updateNodelink(root, source) {

        root.sort((a, b) => a.data.name.localeCompare(b.data.name))

        // Compute the layout.
        const dx = 25;
        const dy = width / (root.height + 1.5);
        d3.tree().nodeSize([dx, dy])(root);

        // Center the tree.
        let x0 = Infinity;
        let x1 = -x0;
        root.each(d => {
            if (d.x > x1) x1 = d.x;
            if (d.x < x0) x0 = d.x;
        });

        // Compute the default height.
        let treeHeight = x1 - x0 + dx * 2;

        const svg = d3.select(nodelinkRef.current)
            // .attr("style", "max-width: 100%; height: auto; height: intrinsic;")
            .attr("font-family", "sans-serif")
            .attr("font-size", 15)
            .attr("width", width)
            .attr("height", height)

        svg.transition()
            .duration(700)
            .ease(d3.easeSin)
            .attr("viewBox", [-dy * 3 / 4, x0 - dx, width + dy / 2, treeHeight])

        svg.selectAll('.nodeG')
            .data([null])
            .join("g")
            .attr('class', 'nodeG')
            .selectAll("g")
            .data(root.descendants(), d => d.id || (d.id = ++i))
            .join(
                (enter) => {
                    const node = enter.append('g')
                        .attr('class', 'node')
                        .style('cursor', d => d.children || d._children ? 'pointer' : 'default')
                        .attr('transform', `translate(${source.y},${source.x})`)
                        .on('click', click)
                        .on('mouseover', hover)
                        .on('mouseout', exit)

                    node.transition()
                        .duration(700)
                        .attr("transform", d => `translate(${d.y},${d.x})`)

                    node.append('circle')
                        .attr('r', 0)
                        .transition()
                        .duration(700)
                        .call(updateCircle)

                    node.append('text')
                        .attr('opacity', 0)
                        .transition()
                        .duration(700)
                        .call(updateText)

                },
                (update) => update.call(update => {
                    update
                        .transition()
                        .duration(700)
                        // update group position
                        .attr("transform", d => `translate(${d.y},${d.x})`)

                    update.select('circle')
                        .call(updateCircle)

                    update.select('text')
                        .call(updateText)
                }),
                (exit) => {
                    exit
                        .transition()
                        .duration(700)
                        .attr('transform', `translate(${source.y},${source.x})`)
                        .remove()

                    exit.select('circle')
                        .transition()
                        .duration(700)
                        .attr('r', 0)

                    exit.select('text')
                        .transition()
                        .duration(700)
                        .attr('opacity', 0)
                }
            )

        svg.selectAll('.linkG')
            .data([null])
            .join("g")
            .lower()
            .attr('class', 'linkG')
            .attr("fill", "none")
            .attr("stroke", '#999')
            .attr("stroke-opacity", 0.7)
            .attr("stroke-width", 2)
            .style('pointer-events', 'none')
            .selectAll("path")
            .data(root.links(), d => d.target.id)
            .join(
                (enter) =>
                    enter.append('path')
                        .attr("d", d3.linkHorizontal()
                            .x(source.y)
                            .y(source.x)
                        )
                        .transition()
                        .duration(700)
                        .attr("d", d3.linkHorizontal()
                            .x(d => d.y)
                            .y(d => d.x)
                        ),
                (update) =>
                    update.call(update => {
                        update
                            .transition()
                            .duration(700)
                            .attr("d", d3.linkHorizontal()
                                .x(d => d.y)
                                .y(d => d.x))
                    }),
                (exit) =>
                    exit
                        .transition()
                        .duration(700)
                        .attr("d", d3.linkHorizontal()
                            .x(source.y)
                            .y(source.x)
                        )
                        .remove()
            )

    }

    // updates the circle for each node in the nodes parameter
    function updateCircle(nodes) {
        nodes
            .attr("fill", d => d._children ? 'skyblue' : '#fff')
            .attr('stroke', '#1c1c1c')
            .attr('stroke-width', 1.5)
            .attr("r", d => d._children ? 5 : 4)
    }

    // updates the text label for each node in the nodes parameter
    function updateText(nodes) {
        nodes
            .attr("dy", "0.32em")
            .attr("x", d => d.children || d._children ? -10 : 6)
            .attr("text-anchor", d => d.children || d._children ? "end" : "start")
            .attr("paint-order", "stroke")
            .attr("stroke", '#fff')
            .attr("stroke-width", 3)
            .attr('opacity', 1)
            .text(d => d.data.name)
    }

    // when a node is clicked (in the nodelink)
    function click(_, d) {

        // toggle children
        if (d.children) {
            d._children = d.children
            d.children = null
        } else {
            d.children = d._children
            d._children = null
        }

        // update both charts
        updateNodelink(root, d)
        updateTreemap(root)

        exit(_,d)
    }

    function hover(_, node) {

        const ancestors = node.ancestors()
        const links = d3.selectAll('.linkG').selectAll('path')
        const rects = d3.selectAll('.treemapRectG').filter(d => d === node)

        links
        .classed('highlight', d => ancestors.includes(d.source) && ancestors.includes(d.target))

        // first raise hovered rect and its label
        rects
        .raise()

        // then highlight the rect
        rects.selectAll('rect')
        .attr('visibility', 'visible')
        .classed('highlight', true)

    }

    function exit() {
        d3.selectAll('path')
        .classed('highlight', false)

        d3.selectAll('.treemapRectG')
        .filter(d => d.children)
        .lower()

        d3.selectAll('rect')
        .classed('highlight', false)
        .attr('visibility', d => d.children ? 'hidden' : 'visible')
    }

    function updateTreemap(root) {

        d3.select(treemapRef.current).selectAll('*').remove()
        root.sort((a, b) => a.value < b.value ? 1 : -1)
        
        let leaves = root.descendants()

        // Compute the treemap layout.
        d3.treemap()
        .tile(d3.treemapBinary)
        .size([width, height])
        .paddingInner(1)
        .paddingTop(1)
        .paddingRight(1)
        .paddingBottom(1)
        .paddingLeft(1)
        .round(true)
        (root);

        // filter out the leaves that are not in the current frame
        leaves = leaves.filter(d => {
            let [minX, maxX] = x.domain()
            let [minY, maxY] = y.domain()
            return (d.x0 >= minX && d.x1 <= maxX) && (d.y0 >= minY && d.y1 <= maxY)
        })

        const svg = d3.select(treemapRef.current)
            .attr("viewBox", [0, -top, width + right, height + top + bottom])
            .attr("width", width)
            .attr("height", height)
            .attr("font-family", "sans-serif")
            .attr("font-size", 14)
            .append('g')
            .attr('class', 'treemapg')
            
        const node = svg.selectAll("g")
            .data(leaves)
            .join("g")
            .attr('class', 'treemapRectG')
            .attr("transform", d => `translate(${x(d.x0)},${y(d.y0)})`)
            .style('cursor', d => d.children || d._children ? 'pointer' : 'default')

        node.append("rect")
            .attr("fill", d => d._children ? 'lightsteelblue' : '#ccc')
            .attr("fill-opacity", d => d.children ? 0 : 0.6)
            .attr("stroke", '#555')
            .attr("stroke-width", 1.5)
            .attr("stroke-opacity", d => d.children ? 0 : 0.7)
            .attr("stroke-linejoin", 'round')
            .attr("width", d => x(d.x1) - x(d.x0))
            .attr("height", d => y(d.y1) - y(d.y0))
            .attr('visibility', d => d.children ? 'hidden' : 'visible')
            .on('click', zoom)
            .on('mouseover', hover)
            .on('mouseout', exit)
            

        node.append("title").text(d =>
                d.ancestors()
                .reverse()
                .slice(1)
                .reduce((acc, curr, i) => {
                    return acc + '\n' + Array(i + 1).fill('\t').reduce((a,c) => a + c, '') + curr.data.name
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
            .attr('visibility', d => d.children ? 'hidden' : 'visible')
            .attr("clip-path", (d, i) => `url(${new URL(`#${uid}-clip-${i}`, location)})`)
            .selectAll("tspan")
            .data((d, i) => `${d.data.name}\n${d.value}`.split(/\n/g))
            .join("tspan")
            .attr("x", 3)
            .attr("y", (d, i, D) => `${(i === D.length - 1) * 0.3 + 1.1 + i * 0.9}em`)
            .attr("fill-opacity", (d, i, D) => i === D.length - 1 ? 0.7 : null)
            .text(d => d)
            .style('pointer-events', 'none')

    }

    function zoom(_, d) {

        // if there is no ancestor one depth lower, just zoom directly to the clicked node
        const topLevelParent = d.ancestors().find(a => a.depth == depth + 1) || d 

        if(topLevelParent.children || topLevelParent._children) {
            // set current depth to the depth we are zooming to
            depth = topLevelParent.depth

            x.domain([topLevelParent.x0, topLevelParent.x1])
            y.domain([topLevelParent.y0, topLevelParent.y1])

        }

        if(topLevelParent._children) {
            click(_, topLevelParent)
        } else {
            updateTreemap(root)
        }
        
    }

    return (
        <div className="panels">
            <div className="nodelink">
                <svg ref={nodelinkRef}/>
            </div>
            <div className="treemap">
                <svg ref={treemapRef} />
            </div>
        </div>
    )
}




