import { Header } from './components/Header.jsx'
import { ControlPanel } from './components/ControlPanel.jsx'
import { ResultsPanel } from './components/ResultsPanel.jsx'
import { useAnalysis } from './hooks/useAnalysis.js'
import styles from './App.module.css'

export default function App() {
  const {
    selectedRoi, selectedPairId, nisarBrowseDates, sensitivity, mode, availablePairs,
    handleRoiChange, handlePairChange, handleNisarBrowseDateChange, handleSensitivityChange,
    handleModeChange, runAnalysis,
    status, result, errorMessage, livePhase, elapsed,
  } = useAnalysis()

  return (
    <div className={styles.shell}>
      <Header />
      <main className={styles.main}>
        <ControlPanel
          selectedRoi={selectedRoi}
          selectedPairId={selectedPairId}
          nisarBrowseDates={nisarBrowseDates}
          sensitivity={sensitivity}
          availablePairs={availablePairs}
          mode={mode}
          onRoiChange={handleRoiChange}
          onPairChange={handlePairChange}
          onNisarBrowseDateChange={handleNisarBrowseDateChange}
          onSensitivityChange={handleSensitivityChange}
          onModeChange={handleModeChange}
          onAnalyze={runAnalysis}
          status={status}
        />
        <ResultsPanel
          status={status}
          result={result}
          nisarBrowseDates={nisarBrowseDates}
          mode={mode}
          errorMessage={errorMessage}
          livePhase={livePhase}
          elapsed={elapsed}
        />
      </main>
    </div>
  )
}
