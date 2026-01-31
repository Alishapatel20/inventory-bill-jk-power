import React, { useEffect } from "react";
import "./BillForm.css";

const parseQuantity = (qty) => {
  if (!qty) return 0;
  const match = qty.toString().match(/(\d+(\.\d+)?)/);
  return match ? parseFloat(match[0]) : 0;
};

const PdfTemplate = ({ values, allProjects = [], onReady }) => {
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
    pdfFormat = "horizontal", // Default to horizontal if not provided
  } = values;

  const isHorizontal = pdfFormat === "horizontal";

  return (
    <div className={`pdf-wrapper ${isHorizontal ? '' : 'vertical'}`}>

      {/* ===== TITLE ===== */}
      <h1 className="pdf-main-title">INVENTORY BILL SUMMARY</h1>
      <h3 className="pdf-sub-title">Sub-Work Order Performance Report</h3>

      {/* ===== BASIC DETAILS ===== */}
      <div className="pdf-section" style={isHorizontal ? { pageBreakAfter: "always" } : {}}>
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
                  {/* Location Header Div - Extracted from table to ensure better block cohesion */}
                  <div style={{
                    backgroundColor: "#444",
                    color: "white",
                    padding: "8px 12px",
                    fontWeight: "bold",
                    fontSize: "14px",
                    border: "2px solid #333",
                    borderBottom: "none", // visually connect to table
                    marginBottom: "0", // Ensure no gap
                    textAlign: "left"
                  }}>
                    {entry.name}
                  </div>

                  {/* Conditional Table Rendering Based on Format */}
                  {isHorizontal ? (
                    // HORIZONTAL FORMAT (Items as Columns)
                    <table className="project-table" style={{ width: "100%", borderCollapse: "collapse", marginTop: "-2px", tableLayout: "fixed" }}>
                      <tbody>
                        {/* Item Code Row */}
                        <tr>
                          <th style={{ width: "80px", border: "2px solid #333", background: "#f1f1f1", padding: "4px", textAlign: "left", fontWeight: "bold", fontSize: "9px" }}>Item Code</th>
                          {entry.descriptions.map((d, i) => (
                            <td key={i} style={{ border: "1px solid #333", padding: "3px", textAlign: "center", fontSize: "8px", wordWrap: "break-word", overflow: "hidden" }}>
                              {d.itemCode === "9925000010" ? "" : d.itemCode}
                            </td>
                          ))}
                        </tr>
                        {/* Description Row */}
                        <tr>
                          <th style={{ width: "80px", border: "2px solid #333", background: "#f1f1f1", padding: "4px", textAlign: "left", fontWeight: "bold", fontSize: "9px" }}>Description</th>
                          {entry.descriptions.map((d, i) => (
                            <td key={i} style={{ border: "1px solid #333", padding: "3px", textAlign: "left", fontSize: "7px", lineHeight: "1.2", wordWrap: "break-word", overflow: "hidden", maxHeight: "50px" }}>
                              {d.desc}
                            </td>
                          ))}
                        </tr>
                        {/* Main Cable Row */}
                        <tr>
                          <th style={{ width: "80px", border: "2px solid #333", background: "#f1f1f1", padding: "4px", textAlign: "left", fontWeight: "bold", fontSize: "9px" }}>Main Cable</th>
                          {entry.descriptions.map((d, i) => (
                            <td key={i} style={{ border: "1px solid #333", padding: "3px", textAlign: "center", fontSize: "8px" }}>
                              {d.mainCableQty ? `${d.mainCableQty} ${d.unit ? d.unit.toLowerCase() : ""}` : "-"}
                            </td>
                          ))}
                        </tr>
                        {/* Spare Cable Row */}
                        <tr>
                          <th style={{ width: "80px", border: "2px solid #333", background: "#f1f1f1", padding: "4px", textAlign: "left", fontWeight: "bold", fontSize: "9px" }}>Spare Cable</th>
                          {entry.descriptions.map((d, i) => (
                            <td key={i} style={{ border: "1px solid #333", padding: "3px", textAlign: "center", fontSize: "8px" }}>
                              {d.spareCableQty ? `${d.spareCableQty} ${d.unit ? d.unit.toLowerCase() : ""}` : "-"}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  ) : (
                    // VERTICAL FORMAT (Items as Rows - Traditional)
                    <table className="project-table" style={{ width: "100%", borderCollapse: "collapse", marginTop: "-2px" }}>
                      <thead>
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
                            <td style={{ border: "1px solid #333", padding: "6px" }}>{d.itemCode === "9925000010" ? "" : d.itemCode}</td>
                            <td style={{ border: "1px solid #333", padding: "6px", textAlign: "left" }}>{d.desc}</td>
                            <td style={{ border: "1px solid #333", padding: "6px", textAlign: "center" }}>
                              {d.mainCableQty ? `${d.mainCableQty} ${d.unit ? d.unit.toLowerCase() : ""}` : "-"}
                            </td>
                            <td style={{ border: "1px solid #333", padding: "6px", textAlign: "center" }}>
                              {d.spareCableQty ? `${d.spareCableQty} ${d.unit ? d.unit.toLowerCase() : ""}` : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ))}

              {/* Project Grand Total - Separate Table matching Live View (Black & White) */}
              <div style={{ marginTop: "20px", padding: "0", border: "2px solid #333", borderRadius: "0", backgroundColor: "#fff", pageBreakInside: "avoid", breakInside: "avoid" }}>
                <div style={{
                  backgroundColor: "#f1f1f1",
                  padding: "10px",
                  borderBottom: "2px solid #333",
                  textAlign: "center"
                }}>
                  <h6 style={{ color: "#000", fontWeight: "bold", margin: "0", fontSize: "16px" }}>
                    Project Total for: {project.projectName} <span style={{ fontWeight: "normal", fontSize: "0.9em" }}>({project.projectNumber})</span>
                  </h6>
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "center", marginBottom: "0", tableLayout: isHorizontal ? "fixed" : "auto" }}>
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
                            <td colSpan="100%" style={{ padding: "15px", color: "#6c757d", border: "1px solid #dee2e6" }}>
                              No cable quantities added
                            </td>
                          </tr>
                        );
                      }

                      const sortedOrder = order.sort();
                      const items = sortedOrder.map(key => totals[key]);

                      // Calculate Total Utilized for specific items within this project
                      let totalUtilized = 0;
                      project.entries.forEach(entry => {
                        entry.descriptions.forEach(d => {
                          let isMatch = false;
                          if (d.itemCode === "9925000007") isMatch = true;
                          if (d.itemCode === "9925000047" && d.desc.includes("11KV cable loop")) isMatch = true;
                          if (d.itemCode === "9925000010") isMatch = true;

                          if (isMatch) {
                            totalUtilized += parseQuantity(d.mainCableQty);
                            totalUtilized += parseQuantity(d.spareCableQty);
                          }
                        });
                      });

                      if (isHorizontal) {
                        // HORIZONTAL FORMAT
                        return (
                          <>
                            {/* Item Code Row */}
                            <tr>
                              <th style={{ width: "80px", border: "2px solid #333", background: "#fff", padding: "4px", textAlign: "left", fontWeight: "bold", fontSize: "9px" }}>Item Code</th>
                              {items.map((item, idx) => (
                                <td key={idx} style={{ padding: "3px", border: "1px solid #333", fontSize: "8px", textAlign: "center", wordWrap: "break-word" }}>
                                  {item.itemCode === "9925000010" ? "" : (item.itemCode || "-")}
                                </td>
                              ))}
                            </tr>
                            {/* Description Row */}
                            <tr>
                              <th style={{ width: "80px", border: "2px solid #333", background: "#fff", padding: "4px", textAlign: "left", fontWeight: "bold", fontSize: "9px" }}>Description</th>
                              {items.map((item, idx) => (
                                <td key={idx} style={{ padding: "3px", border: "1px solid #333", fontSize: "7px", textAlign: "left", lineHeight: "1.2", wordWrap: "break-word", maxHeight: "50px", overflow: "hidden" }}>
                                  {item.desc}
                                </td>
                              ))}
                            </tr>
                            {/* Total Main Cable Row */}
                            <tr>
                              <th style={{ width: "80px", border: "2px solid #333", background: "#fff", padding: "4px", textAlign: "left", fontWeight: "bold", fontSize: "9px" }}>Total Main</th>
                              {items.map((item, idx) => (
                                <td key={idx} style={{ padding: "3px", border: "1px solid #333", fontSize: "8px", textAlign: "center" }}>
                                  {item.main > 0 ? `${item.main} ${item.unit ? item.unit : ""}` : "-"}
                                </td>
                              ))}
                            </tr>
                            {/* Total Spare Cable Row */}
                            <tr>
                              <th style={{ width: "80px", border: "2px solid #333", background: "#fff", padding: "4px", textAlign: "left", fontWeight: "bold", fontSize: "9px" }}>Total Spare</th>
                              {items.map((item, idx) => (
                                <td key={idx} style={{ padding: "3px", border: "1px solid #333", fontSize: "8px", textAlign: "center" }}>
                                  {item.spare > 0 ? `${item.spare} ${item.unit ? item.unit : ""}` : "-"}
                                </td>
                              ))}
                            </tr>
                          </>
                        );
                      } else {
                        // VERTICAL FORMAT
                        return (
                          <>
                            <tr>
                              <th style={{ width: "20%", border: "2px solid #333", background: "#fff", padding: "8px" }}>Item Code</th>
                              <th style={{ border: "2px solid #333", background: "#fff", padding: "8px" }}>Description</th>
                              <th style={{ width: "15%", border: "2px solid #333", background: "#fff", padding: "8px" }}>Total Main</th>
                              <th style={{ width: "15%", border: "2px solid #333", background: "#fff", padding: "8px" }}>Total Spare</th>
                            </tr>
                            {items.map((item, idx) => (
                              <tr key={idx}>
                                <td style={{ border: "1px solid #333", padding: "6px" }}>{item.itemCode === "9925000010" ? "" : (item.itemCode || "-")}</td>
                                <td style={{ border: "1px solid #333", padding: "6px", textAlign: "left" }}>{item.desc}</td>
                                <td style={{ border: "1px solid #333", padding: "6px", textAlign: "center" }}>
                                  {item.main > 0 ? `${item.main} ${item.unit ? item.unit : ""}` : "-"}
                                </td>
                                <td style={{ border: "1px solid #333", padding: "6px", textAlign: "center" }}>
                                  {item.spare > 0 ? `${item.spare} ${item.unit ? item.unit : ""}` : "-"}
                                </td>
                              </tr>
                            ))}
                          </>
                        );
                      }
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== GRAND TOTAL (DESCRIPTION-WISE) ===== */}
      {allProjects.length > 1 && (
        <div style={{ padding: "15px 15px 30px 15px", border: "1px solid #dee2e6", borderRadius: "5px", backgroundColor: "#fff", marginTop: "20px", pageBreakInside: "avoid", breakInside: "avoid" }}>
          <h6 style={{ color: "#000", fontWeight: "bold", marginBottom: "25px", marginTop: "0", textAlign: "center", textTransform: "uppercase", fontSize: "14px" }}>
            Grand Total (Description-wise)
          </h6>

          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "center", marginBottom: "0", tableLayout: isHorizontal ? "fixed" : "auto" }}>
            <tbody>
              {(() => {
                const grandTotals = {};
                const order = [];
                let totalUtilized = 0;

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

                      // Calculate Total Utilized for specific items
                      let isMatch = false;
                      // 9925000007: Horizontal drilling...
                      if (d.itemCode === "9925000007") isMatch = true;
                      // 9925000047: 11KV cable loop at transformer & DP (Check description as code is reused)
                      if (d.itemCode === "9925000047" && d.desc.includes("11KV cable loop")) isMatch = true;
                      // 9925000010: Cable rising at DP structure
                      if (d.itemCode === "9925000010") isMatch = true;

                      if (isMatch) {
                        totalUtilized += parseQuantity(d.mainCableQty);
                        totalUtilized += parseQuantity(d.spareCableQty);
                      }
                    });
                  });
                });

                if (order.length === 0) {
                  return (
                    <tr>
                      <td colSpan="100%" style={{ padding: "15px", color: "#6c757d", border: "1px solid #dee2e6" }}>
                        No items found across projects
                      </td>
                    </tr>
                  );
                }

                const sortedOrder = order.sort();
                const items = sortedOrder.map(key => grandTotals[key]);

                if (isHorizontal) {
                  // HORIZONTAL FORMAT
                  return (
                    <>
                      {/* Item Code Row */}
                      <tr style={{ borderBottom: "2px solid #000", color: "#000" }}>
                        <th style={{ width: "80px", border: "2px solid #333", background: "#fff", padding: "4px", textAlign: "left", fontWeight: "bold", fontSize: "9px" }}>Item Code</th>
                        {items.map((item, idx) => (
                          <td key={idx} style={{ padding: "3px", border: "1px solid #333", fontSize: "8px", textAlign: "center", wordWrap: "break-word" }}>
                            {item.itemCode === "9925000010" ? "" : (item.itemCode || "-")}
                          </td>
                        ))}
                      </tr>
                      {/* Description Row */}
                      <tr>
                        <th style={{ width: "80px", border: "2px solid #333", background: "#fff", padding: "4px", textAlign: "left", fontWeight: "bold", fontSize: "9px" }}>Description</th>
                        {items.map((item, idx) => (
                          <td key={idx} style={{ padding: "3px", border: "1px solid #333", fontSize: "7px", textAlign: "left", lineHeight: "1.2", wordWrap: "break-word", maxHeight: "50px", overflow: "hidden" }}>
                            {item.desc}
                          </td>
                        ))}
                      </tr>
                      {/* Total Main Cable Row */}
                      <tr>
                        <th style={{ width: "80px", border: "2px solid #333", background: "#fff", padding: "4px", textAlign: "left", fontWeight: "bold", fontSize: "9px" }}>Total Main</th>
                        {items.map((item, idx) => (
                          <td key={idx} style={{ padding: "3px", border: "1px solid #333", fontSize: "8px", textAlign: "center" }}>
                            {item.main > 0 ? `${item.main} ${item.unit ? item.unit : ""}` : "-"}
                          </td>
                        ))}
                      </tr>
                      {/* Total Spare Cable Row */}
                      <tr>
                        <th style={{ width: "80px", border: "2px solid #333", background: "#fff", padding: "4px", textAlign: "left", fontWeight: "bold", fontSize: "9px" }}>Total Spare</th>
                        {items.map((item, idx) => (
                          <td key={idx} style={{ padding: "3px", border: "1px solid #333", fontSize: "8px", textAlign: "center" }}>
                            {item.spare > 0 ? `${item.spare} ${item.unit ? item.unit : ""}` : "-"}
                          </td>
                        ))}
                      </tr>
                    </>
                  );
                } else {
                  // VERTICAL FORMAT
                  return (
                    <>
                      <tr style={{ borderBottom: "2px solid #000", color: "#000" }}>
                        <th style={{ width: "20%", border: "2px solid #333", background: "#fff", padding: "8px" }}>Item Code</th>
                        <th style={{ border: "2px solid #333", background: "#fff", padding: "8px" }}>Description</th>
                        <th style={{ width: "15%", border: "2px solid #333", background: "#fff", padding: "8px" }}>Total Main</th>
                        <th style={{ width: "15%", border: "2px solid #333", background: "#fff", padding: "8px" }}>Total Spare</th>
                      </tr>
                      {items.map((item, idx) => (
                        <tr key={idx}>
                          <td style={{ border: "1px solid #333", padding: "6px" }}>{item.itemCode === "9925000010" ? "" : (item.itemCode || "-")}</td>
                          <td style={{ border: "1px solid #333", padding: "6px", textAlign: "left" }}>{item.desc}</td>
                          <td style={{ border: "1px solid #333", padding: "6px", textAlign: "center" }}>
                            {item.main > 0 ? `${item.main} ${item.unit ? item.unit : ""}` : "-"}
                          </td>
                          <td style={{ border: "1px solid #333", padding: "6px", textAlign: "center" }}>
                            {item.spare > 0 ? `${item.spare} ${item.unit ? item.unit : ""}` : "-"}
                          </td>
                        </tr>
                      ))}
                    </>
                  );
                }
              })()}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PdfTemplate;
