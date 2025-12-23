import React, { useEffect } from "react";
import "./BillForm.css";

const parseQuantity = (qty) => {
  if (!qty) return 0;
  const match = qty.toString().match(/(\d+(\.\d+)?)/);
  return match ? parseFloat(match[0]) : 0;
};

const PdfTemplate = ({ values, onReady }) => {
  useEffect(() => {
    onReady && onReady();
  }, []);

  const {
    name,
    dateOfCommunication,
    workOrderNumber,
    poNumber,
    dueDateOfCommencement,
    jwoNumber,
    subDivision,
    dueDateOfCompletionOfWork,
    dateOfCompletion,
    nameOfWork,
    timeLimitAsPerSubWorkOrder,
    nameOfContractor,
    allProjects = [],
  } = values;

  return (
    <div className="pdf-wrapper">

      {/* ===== TITLE ===== */}
      <h1 className="pdf-main-title">INVENTORY BILL SUMMARY</h1>
      <h3 className="pdf-sub-title">Sub-Work Order Performance Report</h3>

      {/* ===== BASIC DETAILS ===== */}
      <div className="pdf-section">
        <h2 className="section-title">Work Details</h2>

        <table className="info-table">
          <tbody>
            <tr><th>Name</th><td>{name || "-"}</td></tr>
            <tr><th>Date of Communication</th><td>{dateOfCommunication || "-"}</td></tr>
            <tr><th>Work Order Number</th><td>{workOrderNumber || "-"}</td></tr>
            <tr><th>P.O. Number</th><td>{poNumber || "-"}</td></tr>
            <tr><th>Due Date of Commencement</th><td>{dueDateOfCommencement || "-"}</td></tr>
            <tr><th>J.W.O Number</th><td>{jwoNumber || "-"}</td></tr>
            <tr><th>Sub-Division</th><td>{subDivision || "-"}</td></tr>
            <tr><th>Work Completion Due Date</th><td>{dueDateOfCompletionOfWork || "-"}</td></tr>
            <tr><th>Actual Completion Date</th><td>{dateOfCompletion || "-"}</td></tr>
            <tr><th>Name of Work</th><td>{nameOfWork || "-"}</td></tr>
            <tr><th>Time Limit (As per Sub Work Order)</th><td>{timeLimitAsPerSubWorkOrder || "-"}</td></tr>
            <tr><th>Contractor Name</th><td>{nameOfContractor || "-"}</td></tr>
          </tbody>
        </table>
      </div>

      {/* ===== PROJECTS ===== */}
      {allProjects.length > 0 && (
        <div className="pdf-section">
          <h2 className="section-title">Project Breakdown</h2>

          {allProjects.map((project, index) => (
            <div key={index} className="project-box">
              <div className="project-header">
                <strong>{project.projectName}</strong>
                <span>#{project.projectNumber}</span>
              </div>

              <table className="project-table">
                <thead>
                  <tr>
                    <th style={{ width: "18%" }}>Location Name</th>
                    <th style={{ width: "15%" }}>Item Code</th>
                    <th>Description</th>
                    <th style={{ width: "12%" }}>Main Cable</th>
                    <th style={{ width: "12%" }}>Spare Cable</th>
                  </tr>
                </thead>
                {project.entries.map((entry, eIndex) => {
                  entry.descriptions.forEach((d) => {
                    // No complex unit aggregation for totals anymore
                  });

                  return (
                    <tbody key={eIndex} className="entry-group">
                      {entry.descriptions.map((d, i) => (
                        <tr key={i}>
                          {i === 0 && (
                            <td
                              rowSpan={entry.descriptions.length + 1}
                              className="left-name-cell"
                            >
                              {entry.name}
                            </td>
                          )}
                          <td>{d.itemCode}</td>
                          <td>{d.desc}</td>
                          <>
                            <td>
                              {d.mainCableQty ? `${d.mainCableQty} ${d.unit && d.unit !== "Meter" ? d.unit.toLowerCase() : ""}` : "-"}
                            </td>
                            <td>
                              {d.spareCableQty ? `${d.spareCableQty} ${d.unit && d.unit !== "Meter" ? d.unit.toLowerCase() : ""}` : "-"}
                            </td>
                          </>
                        </tr>
                      ))}

                      {/* Entry Total Removed as per request */}
                    </tbody>
                  );
                })}
              </table>

              {/* Project Grand Total - Separate Table matching Live View (Black & White) */}
              <div style={{ marginTop: "5px", padding: "15px 15px 30px 15px", border: "1px solid #dee2e6", borderRadius: "5px", backgroundColor: "#fff" }}>
                <h5 style={{ color: "#000", fontWeight: "bold", marginBottom: "25px", marginTop: "0" }}>
                  Project Total for:
                  <span style={{ color: "#000", marginLeft: "20px" }}>{project.projectName}</span>
                  <span style={{ color: "#6c757d", marginLeft: "10px", fontSize: "0.9em" }}>({project.projectNumber})</span>
                </h5>

                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "center", marginBottom: "0" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #000", color: "#000" }}>
                      <th style={{ padding: "10px", border: "1px solid #dee2e6", width: "15%" }}>Item Code</th>
                      <th style={{ padding: "10px", border: "1px solid #dee2e6", width: "45%" }}>Description</th>
                      <th style={{ padding: "10px", border: "1px solid #dee2e6", width: "20%" }}>Total Main Cable</th>
                      <th style={{ padding: "10px", border: "1px solid #dee2e6", width: "20%" }}>Total Spare Cable</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const totals = {};
                      const order = [];

                      project.entries.forEach(entry => {
                        entry.descriptions.forEach(d => {
                          const key = d.itemCode;
                          if (!totals[key]) {
                            totals[key] = {
                              itemCode: d.itemCode,
                              desc: d.desc,
                              unit: d.unit,
                              main: 0,
                              spare: 0
                            };
                            order.push(key);
                          }
                          totals[key].main += parseQuantity(d.mainCableQty);
                          totals[key].spare += parseQuantity(d.spareCableQty);
                        });
                      });

                      if (order.length === 0) {
                        return (
                          <tr>
                            <td colSpan="4" style={{ padding: "15px", color: "#6c757d", border: "1px solid #dee2e6" }}>
                              No cable quantities added
                            </td>
                          </tr>
                        );
                      }

                      return order.sort().map((key, idx) => {
                        const item = totals[key];
                        return (
                          <tr key={idx}>
                            <td style={{ padding: "10px", border: "1px solid #dee2e6" }}>{item.itemCode || "-"}</td>
                            <td style={{ padding: "10px", border: "1px solid #dee2e6", textAlign: "left" }}>{item.desc}</td>
                            <td style={{ padding: "10px", border: "1px solid #dee2e6" }}>
                              {item.main > 0 ? `${item.main} ${item.unit && item.unit !== "Meter" ? item.unit : ""}` : "-"}
                            </td>
                            <td style={{ padding: "10px", border: "1px solid #dee2e6" }}>
                              {item.spare > 0 ? `${item.spare} ${item.unit && item.unit !== "Meter" ? item.unit : ""}` : "-"}
                            </td>
                          </tr>
                        )
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PdfTemplate;
