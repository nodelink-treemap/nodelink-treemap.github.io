import { useEffect, useReducer, useState } from 'react'

import Panels from './components/Panels'

import * as d3 from 'd3'

import './App.css'

function App() {
  const datasets = [
    'flare',
    'flareFull',
    'ListYearFile',
    'sevendiseasereligion',
  ]

  const [data, setData] = useState({
    ListYearFile: undefined,
    sevendiseasereligion: undefined,
    flare: undefined,
    flareFull: undefined,
  })

  const [currentData, setCurrentData] = useState(undefined)

  // on load, get csv files
  useEffect(() => {

    async function fetch() {
      let listYearFileData = await d3.csv('/ListYearFile.csv')
      
      let sevendiseasereligionData = await d3.csv('/sevendiseasereligion.csv')
      let flareData = await d3.json('/flare.json')
      let flareFullData = await d3.json('/flareFull.json')
      setData({ 
        ListYearFile: listYearFileData, 
        sevendiseasereligion: sevendiseasereligionData, 
        flare: flareData,
        flareFull: flareFullData,
      })
      setCurrentData(flareData)
    }
    fetch()

  }, [])

  const handleChange = (event) => {
    const value = event.target.value;
    setCurrentData(data[value])
  }
  
  return (
    <div className="app">
      <div className='topWrapper'>
        <select onChange={handleChange}>
          {datasets.map((d, i) => <option key={i} value={d}>{d}</option>)}
        </select>

        <h1>Welcome to nodelink-treemap</h1>

        {/* disabled dropdown for even spacing */}
        <select disabled="disabled">
        {datasets.map((d, i) => <option key={i} value={d}>{d}</option>)}
        </select>
      </div>
      <Panels data={currentData}/>  
    </div>
  )
}

export default App
