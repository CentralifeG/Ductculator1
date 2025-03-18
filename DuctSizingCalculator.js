import React, { useState, useEffect } from 'react';
import './DuctSizingCalculator.css';

const DuctSizingCalculator = () => {
  // State for input parameters
  const [parameters, setParameters] = useState({
    velocity: 10,
    pressureLoss: 1.2,
    roughness: 0.0001,
    flexFactor: 1.5,
    density: 1.2,
    viscosity: 0.000015
  });

  // State for calculated tables
  const [rectangularDucts, setRectangularDucts] = useState([]);
  const [roundDucts, setRoundDucts] = useState([]);
  const [flexibleDucts, setFlexibleDucts] = useState([]);

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setParameters({
      ...parameters,
      [name]: parseFloat(value)
    });
  };

  // Calculate rectangular duct airflow
  const calculateRectangularAirflow = (width, height) => {
    // Convert dimensions to meters
    const widthM = width / 100;
    const heightM = height / 100;
    
    // Check aspect ratio
    if (width / height > 4 || height / width > 4) {
      return null;
    }
    
    // Calculate area and perimeter
    const area = widthM * heightM;
    const perimeter = 2 * (widthM + heightM);
    
    // Calculate hydraulic diameter
    const hydraulicDiameter = (4 * area) / perimeter;
    
    // Calculate Reynolds number
    const reynoldsNumber = parameters.velocity * hydraulicDiameter / parameters.viscosity;
    
    // Calculate relative roughness
    const relativeRoughness = parameters.roughness / hydraulicDiameter;
    
    // Calculate friction factor
    let frictionFactor;
    if (reynoldsNumber < 2000) {
      frictionFactor = 64 / reynoldsNumber;
    } else if (reynoldsNumber > 4000) {
      frictionFactor = 0.11 * Math.pow((relativeRoughness + 68/reynoldsNumber), 0.25);
    } else {
      // Transition region
      const f1 = 64 / 2000;
      const f2 = 0.11 * Math.pow((relativeRoughness + 68/4000), 0.25);
      frictionFactor = f1 + (reynoldsNumber - 2000) * (f2 - f1) / 2000;
    }
    
    // Calculate max velocity from pressure loss
    const maxVelocityFromPressure = Math.sqrt((2 * parameters.pressureLoss * hydraulicDiameter) / (frictionFactor * parameters.density));
    
    // Use minimum of input velocity and max velocity from pressure
    const actualVelocity = Math.min(parameters.velocity, maxVelocityFromPressure);
    
    // Calculate airflow
    const airflow = actualVelocity * area * 3600; // m³/h
    
    return Math.round(airflow);
  };

  // Calculate round duct airflow
  const calculateRoundAirflow = (diameter) => {
    // Convert diameter to meters
    const diameterM = diameter / 100;
    
    // Calculate area
    const area = Math.PI * Math.pow(diameterM / 2, 2);
    
    // For round ducts, hydraulic diameter equals actual diameter
    const hydraulicDiameter = diameterM;
    
    // Calculate Reynolds number
    const reynoldsNumber = parameters.velocity * hydraulicDiameter / parameters.viscosity;
    
    // Calculate relative roughness
    const relativeRoughness = parameters.roughness / hydraulicDiameter;
    
    // Calculate friction factor
    let frictionFactor;
    if (reynoldsNumber < 2000) {
      frictionFactor = 64 / reynoldsNumber;
    } else if (reynoldsNumber > 4000) {
      frictionFactor = 0.11 * Math.pow((relativeRoughness + 68/reynoldsNumber), 0.25);
    } else {
      // Transition region
      const f1 = 64 / 2000;
      const f2 = 0.11 * Math.pow((relativeRoughness + 68/4000), 0.25);
      frictionFactor = f1 + (reynoldsNumber - 2000) * (f2 - f1) / 2000;
    }
    
    // Calculate max velocity from pressure loss
    const maxVelocityFromPressure = Math.sqrt((2 * parameters.pressureLoss * hydraulicDiameter) / (frictionFactor * parameters.density));
    
    // Use minimum of input velocity and max velocity from pressure
    const actualVelocity = Math.min(parameters.velocity, maxVelocityFromPressure);
    
    // Calculate airflow
    const airflow = actualVelocity * area * 3600; // m³/h
    
    return {
      airflow: Math.round(airflow),
      velocity: Math.round(actualVelocity * 10) / 10
    };
  };

  // Calculate flexible duct airflow
  const calculateFlexibleAirflow = (diameter) => {
    // For flexible ducts, we increase roughness and add resistance factor
    const effectiveRoughness = parameters.roughness * parameters.flexFactor;
    
    // Convert diameter to meters
    const diameterM = diameter / 100;
    
    // Calculate area
    const area = Math.PI * Math.pow(diameterM / 2, 2);
    
    // For round ducts, hydraulic diameter equals actual diameter
    const hydraulicDiameter = diameterM;
    
    // Calculate Reynolds number
    const reynoldsNumber = parameters.velocity * hydraulicDiameter / parameters.viscosity;
    
    // Calculate relative roughness
    const relativeRoughness = effectiveRoughness / hydraulicDiameter;
    
    // Calculate friction factor
    let frictionFactor;
    if (reynoldsNumber < 2000) {
      frictionFactor = 64 / reynoldsNumber;
    } else if (reynoldsNumber > 4000) {
      frictionFactor = 0.11 * Math.pow((relativeRoughness + 68/reynoldsNumber), 0.25);
    } else {
      // Transition region
      const f1 = 64 / 2000;
      const f2 = 0.11 * Math.pow((relativeRoughness + 68/4000), 0.25);
      frictionFactor = f1 + (reynoldsNumber - 2000) * (f2 - f1) / 2000;
    }
    
    // Calculate max velocity from pressure loss
    const maxVelocityFromPressure = Math.sqrt((2 * parameters.pressureLoss * hydraulicDiameter) / (frictionFactor * parameters.density));
    
    // Apply flex factor to reduce velocity (higher resistance)
    const flexAdjustedMaxVelocity = maxVelocityFromPressure / parameters.flexFactor;
    
    // Use minimum of input velocity and flex-adjusted max velocity
    const actualVelocity = Math.min(parameters.velocity, flexAdjustedMaxVelocity);
    
    // Calculate airflow
    const airflow = actualVelocity * area * 3600; // m³/h
    
    return {
      airflow: Math.round(airflow),
      velocity: Math.round(actualVelocity * 10) / 10
    };
  };

  // Generate tables when parameters change
  useEffect(() => {
    // Generate rectangular ducts table
    // Create dimensions from 5cm to 200cm in 5cm increments
    const dimensions = Array.from({ length: 40 }, (_, i) => (i + 1) * 5); // 5 to 200 in 5cm increments
    
    const rectangularTable = dimensions.map(height => {
      const row = {
        height,
        values: {}
      };
      
      dimensions.forEach(width => {
        row.values[width] = calculateRectangularAirflow(width, height);
      });
      
      return row;
    });
    
    setRectangularDucts(rectangularTable);
    
    // Generate round ducts table with specific dimensions in cm
    const roundDiameters = [
      80, 100, 112, 125, 140, 150, 160, 180, 200, 224, 250, 280, 300, 315, 355, 400, 450, 500, 
      560, 630, 710, 800, 900, 1000, 1120, 1250
    ];
    
    const roundTable = roundDiameters.map(diameter => {
      const result = calculateRoundAirflow(diameter);
      return {
        diameter,
        airflow: result.airflow,
        velocity: result.velocity
      };
    });
    
    setRoundDucts(roundTable);
    
    // Generate flexible ducts table with specific dimensions
    const flexibleDiameters = [10, 12.5, 15, 16, 18, 20, 22.4, 25, 28, 31.5, 35.5, 40, 45, 50];
    
    const flexibleTable = flexibleDiameters.map(diameter => {
      const result = calculateFlexibleAirflow(diameter);
      return {
        diameter,
        airflow: result.airflow,
        velocity: result.velocity
      };
    });
    
    setFlexibleDucts(flexibleTable);
  }, [parameters]);

  // Get airflow color class
  const getAirflowColorClass = (airflow) => {
    if (!airflow) return '';
    
    if (airflow < 500) return 'bg-yellow-light';
    if (airflow < 1000) return 'bg-yellow';
    if (airflow < 2000) return 'bg-orange-light';
    if (airflow < 4000) return 'bg-orange';
    return 'bg-red';
  };

  // Reset parameters to defaults
  const resetParameters = () => {
    setParameters({
      velocity: 10,
      pressureLoss: 1.2,
      roughness: 0.0001,
      flexFactor: 1.5,
      density: 1.2,
      viscosity: 0.000015
    });
  };

  // Define the dimensions to display in the rectangular table - now all dimensions from 5 to 200 in 5cm increments
  const displayWidths = Array.from({ length: 40 }, (_, i) => (i + 1) * 5); // 5 to 200 in 5cm increments
  const displayHeights = Array.from({ length: 40 }, (_, i) => (i + 1) * 5); // 5 to 200 in 5cm increments

  // Render the calculator
  return (
    <div className="calculator-container">
      <h1 className="calculator-title">HVAC Duct Sizing Calculator</h1>
      
      {/* Parameters Section */}
      <div className="parameters-section">
        <h2 className="section-title">Parameters</h2>
        <div className="parameters-grid">
          <div className="parameter-item">
            <label>
              Maximum Air Velocity (m/s)
              <input
                type="number"
                name="velocity"
                value={parameters.velocity}
                onChange={handleInputChange}
                min="1"
                max="20"
                step="0.1"
              />
            </label>
          </div>
          
          <div className="parameter-item">
            <label>
              Pressure Drop (Pa/m)
              <input
                type="number"
                name="pressureLoss"
                value={parameters.pressureLoss}
                onChange={handleInputChange}
                min="0.1"
                max="5"
                step="0.1"
              />
            </label>
          </div>
          
          <div className="parameter-item">
            <label>
              Sheet Metal Roughness (m)
              <input
                type="number"
                name="roughness"
                value={parameters.roughness}
                onChange={handleInputChange}
                min="0.00001"
                max="0.001"
                step="0.00001"
              />
            </label>
          </div>
          
          <div className="parameter-item">
            <label>
              Flexible Duct Factor
              <input
                type="number"
                name="flexFactor"
                value={parameters.flexFactor}
                onChange={handleInputChange}
                min="1"
                max="3"
                step="0.1"
              />
            </label>
          </div>
          
          <div className="parameter-item">
            <label>
              Air Density (kg/m³)
              <input
                type="number"
                name="density"
                value={parameters.density}
                onChange={handleInputChange}
                min="0.8"
                max="1.5"
                step="0.01"
              />
            </label>
          </div>
          
          <div className="parameter-item">
            <label>
              Air Kinematic Viscosity (m²/s)
              <input
                type="number"
                name="viscosity"
                value={parameters.viscosity}
                onChange={handleInputChange}
                min="0.00001"
                max="0.0001"
                step="0.000001"
              />
            </label>
          </div>
        </div>
        
        <div className="button-container">
          <button
            onClick={resetParameters}
            className="reset-button"
          >
            Reset to Defaults
          </button>
        </div>
      </div>
      
      {/* Rectangular Ducts Section (Now First) */}
      <div className="ducts-section">
        <h2 className="section-title">Rectangular Ducts - Maximum Airflow (m³/h) - Aspect Ratio ≤ 4:1</h2>
        <div className="rectangular-table-container">
          <table className="rectangular-table">
            <thead>
              <tr>
                <th>Width (cm) ➡<br />Height (cm) ⬇</th>
                {displayWidths.map(width => (
                  <th key={width}>{width}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rectangularDucts
                .filter(row => displayHeights.includes(row.height))
                .map((row, rowIndex) => (
                <tr key={rowIndex}>
                  <td>{row.height}</td>
                  {displayWidths.map(width => (
                    <td 
                      key={width} 
                      className={getAirflowColorClass(row.values[width])}
                    >
                      {row.values[width] ? row.values[width].toLocaleString() : ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="table-notes">
          <p>* Empty cells indicate aspect ratio > 4:1 (not recommended)</p>
          <p>* Color intensity indicates airflow rate magnitude</p>
        </div>
      </div>

      {/* Circular Ducts Section (Now Second) */}
      <div className="ducts-section">
        <h2 className="section-title">Round and Flexible Ducts</h2>
        <div className="ducts-grid">
          {/* Round Ducts Table */}
          <div className="duct-table-container">
            <h3 className="subsection-title">Round Ducts</h3>
            <table className="duct-table">
              <thead>
                <tr>
                  <th>Diameter (cm)</th>
                  <th>Airflow (m³/h)</th>
                  <th>Velocity (m/s)</th>
                </tr>
              </thead>
              <tbody>
                {roundDucts.map((duct, index) => (
                  <tr key={index} className={getAirflowColorClass(duct.airflow)}>
                    <td>{duct.diameter}</td>
                    <td>{duct.airflow.toLocaleString()}</td>
                    <td>{duct.velocity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Flexible Ducts Table */}
          <div className="duct-table-container">
            <h3 className="subsection-title">Flexible Ducts</h3>
            <table className="duct-table">
              <thead>
                <tr>
                  <th>Diameter (cm)</th>
                  <th>Airflow (m³/h)</th>
                  <th>Velocity (m/s)</th>
                </tr>
              </thead>
              <tbody>
                {flexibleDucts.map((duct, index) => (
                  <tr key={index} className={getAirflowColorClass(duct.airflow)}>
                    <td>{duct.diameter}</td>
                    <td>{duct.airflow.toLocaleString()}</td>
                    <td>{duct.velocity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Notes Section */}
      <div className="notes-section">
        <h3 className="notes-title">Notes:</h3>
        <ul className="notes-list">
          <li>Calculations use the ASHRAE friction factor method.</li>
          <li>The maximum allowable aspect ratio for rectangular ducts is 4:1.</li>
          <li>Flexible duct calculations include additional resistance factor (default: 1.5).</li>
          <li>Adjust parameters as needed for specific project requirements.</li>
          <li>Default pressure drop value (1.2 Pa/m) has been calibrated to match typical industry values.</li>
        </ul>
      </div>
    </div>
  );
};

export default DuctSizingCalculator;