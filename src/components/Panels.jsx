import { useRef, useEffect } from 'react'
import { nodelink } from '../charts/nodelink'

import * as d3 from 'd3'

import './panels.css'

export default function Panels({ data }) {

    const nodelinkRef = useRef(null)
    const treemapRef = useRef(null)

    const nodelinkChartDimensions = {
        width: window.innerWidth / 2,
        height: window.innerHeight - 70,
        margin: { 
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
        }
    }

    let nodelinkChart = nodelink()
    .dimensions(nodelinkChartDimensions)

    useEffect(() => {
        
        let nodelinkRefElement = d3.select(nodelinkRef.current)
        // first clear previous state
        nodelinkRefElement.selectAll('*').remove()
        // then call plot with new data
        nodelinkChart.data(data)
        nodelinkRefElement.call(nodelinkChart)
    }, [data])
    

    return (
        <div className="panels">
            <div className="nodelink">
                <svg ref={nodelinkRef} viewBox={`0 0 ${nodelinkChartDimensions.width} ${nodelinkChartDimensions.height}`}/>
            </div>
            <div className="treemap">
                <svg ref={treemapRef} />
            </div>
        </div>
    )
}
