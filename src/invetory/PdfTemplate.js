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

              {project.entries.map((entry, eIndex) => (
                <div key={eIndex} style={{ marginBottom: "20px", pageBreakInside: "avoid", breakInside: "avoid" }}>
                  <table className="project-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      {/* Location Header Row - Moved inside table to fix double border issue */}
                      <tr>
                        <th colSpan="4" style={{
                          backgroundColor: "#444",
                          color: "white",
                          padding: "8px 12px",
                          fontWeight: "bold",
                          fontSize: "14px",
                          border: "2px solid #333",
                          textAlign: "left"
                        }}>
                          {entry.name}
                        </th>
                      </tr>
                      {/* Column Headers */}
                      <tr>
                        <th style={{ width: "20%", border: "2px solid #333", background: "#f1f1f1", padding: "8px" }}>Item Code</th>
                        <th style={{ border: "2px solid #333", background: "#f1f1f1", padding: "8px" }}>Description</th>
                        <th style={{ width: "15%", border: "2px solid #333", background: "#f1f1f1", padding: "8px" }}>Main Cable</th>
                        <th style={{ width: "15%", border: "2px solid #333", background: "#f1f1f1", padding: "8px" }}>Spare Cable</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entry.descriptions.map((d, i) => (
                        <tr key={i}>
                          <td style={{ border: "1px solid #333", padding: "6px" }}>{d.itemCode}</td>
                          <td style={{ border: "1px solid #333", padding: "6px", textAlign: "left" }}>{d.desc}</td>
                          <td style={{ border: "1px solid #333", padding: "6px", textAlign: "center" }}>
                            {d.mainCableQty ? `${d.mainCableQty} ${d.unit && d.unit !== "Meter" ? d.unit.toLowerCase() : ""}` : "-"}
                          </td>
                          <td style={{ border: "1px solid #333", padding: "6px", textAlign: "center" }}>
                            {d.spareCableQty ? `${d.spareCableQty} ${d.unit && d.unit !== "Meter" ? d.unit.toLowerCase() : ""}` : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}

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
                      <th style={{ padding: "10px", border: "2px solid #333", width: "15%" }}>Item Code</th>
                      <th style={{ padding: "10px", border: "2px solid #333", width: "45%" }}>Description</th>
                      <th style={{ padding: "10px", border: "2px solid #333", width: "20%" }}>Total Main Cable</th>
                      <th style={{ padding: "10px", border: "2px solid #333", width: "20%" }}>Total Spare Cable</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const totals = {};
                      const order = [];

                      project.entries.forEach(entry => {
                        entry.descriptions.forEach(d => {
                          const key = `${d.itemCode}_${d.desc}`;
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
                            <td style={{ padding: "10px", border: "1px solid #333" }}>{item.itemCode || "-"}</td>
                            <td style={{ padding: "10px", border: "1px solid #333", textAlign: "left" }}>{item.desc}</td>
                            <td style={{ padding: "10px", border: "1px solid #333" }}>
                              {item.main > 0 ? `${item.main} ${item.unit && item.unit !== "Meter" ? item.unit : ""}` : "-"}
                            </td>
                            <td style={{ padding: "10px", border: "1px solid #333" }}>
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

      {/* ===== GRAND TOTAL (DESCRIPTION-WISE) ===== */}
      {allProjects.length > 0 && (
        <div style={{ padding: "15px 15px 30px 15px", border: "1px solid #dee2e6", borderRadius: "5px", backgroundColor: "#fff", marginTop: "20px" }}>
          <h5 style={{ color: "#000", fontWeight: "bold", marginBottom: "25px", marginTop: "0", textAlign: "center", textTransform: "uppercase" }}>
            Grand Total (Description-wise)
          </h5>

          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "center", marginBottom: "0" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #000", color: "#000" }}>
                <th style={{ padding: "10px", border: "2px solid #333", width: "15%" }}>Item Code</th>
                <th style={{ padding: "10px", border: "2px solid #333", width: "45%" }}>Description</th>
                <th style={{ padding: "10px", border: "2px solid #333", width: "20%" }}>Total Main Cable</th>
                <th style={{ padding: "10px", border: "2px solid #333", width: "20%" }}>Total Spare Cable</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const grandTotals = {};
                const order = [];

                allProjects.forEach(proj => {
                  proj.entries.forEach(entry => {
                    entry.descriptions.forEach(d => {
                      // Same composite key logic as per previous fix: Item Code + Description
                      const key = `${d.itemCode}_${d.desc}`;

                      if (!grandTotals[key]) {
                        grandTotals[key] = {
                          itemCode: d.itemCode,
                          desc: d.desc,
                          unit: d.unit,
                          main: 0,
                          spare: 0
                        };
                        order.push(key);
                      }
                      grandTotals[key].main += parseQuantity(d.mainCableQty);
                      grandTotals[key].spare += parseQuantity(d.spareCableQty);
                    });
                  });
                });

                if (order.length === 0) {
                  return (
                    <tr>
                      <td colSpan="4" style={{ padding: "15px", color: "#6c757d", border: "1px solid #dee2e6" }}>
                        No items found across projects
                      </td>
                    </tr>
                  );
                }

                return order.sort().map((key, idx) => {
                  const item = grandTotals[key];
                  return (
                    <tr key={idx}>
                      <td style={{ padding: "10px", border: "1px solid #333" }}>{item.itemCode || "-"}</td>
                      <td style={{ padding: "10px", border: "1px solid #333", textAlign: "left" }}>{item.desc}</td>
                      <td style={{ padding: "10px", border: "1px solid #333" }}>
                        {item.main > 0 ? `${item.main} ${item.unit && item.unit !== "Meter" ? item.unit : ""}` : "-"}
                      </td>
                      <td style={{ padding: "10px", border: "1px solid #333" }}>
                        {item.spare > 0 ? `${item.spare} ${item.unit && item.unit !== "Meter" ? item.unit : ""}` : "-"}
                      </td>
                    </tr>
                  )
                });
              })()}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PdfTemplate;
