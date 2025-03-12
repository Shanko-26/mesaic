# **Product Requirements Document (PRD)**
## **AI-Powered Collaborative Measurement & Calibration Tool**

## **1. Overview**
**Objective:**
Develop a **desktop-based measurement analysis and visualization tool** with AI-powered insights and **real-time collaboration**. The tool will allow users to:
1. **Load and visualize .mat/.mf4 measurement data**.
2. **Use AI to ask data-driven questions** and generate insights.
3. **Collaborate in real-time**, adding shared annotations and insights.

## **2. Core Features (MVP Scope)**
### **2.1 Data Handling & Visualization**
- ✅ Support for **.mat (MATLAB) and .mf4 (MDF4)** files.
- ✅ Efficient parsing and rendering of large datasets.
- ✅ **Interactive visualization**: Zoom, pan, multi-signal plotting.
- ✅ Signal selection with customizable views.

### **2.2 AI-Driven Data Analysis**
- ✅ **Natural language queries**: Users can ask questions like:
  - *“What is the max RPM recorded?”*
  - *“Show the trend of fuel consumption.”*
- ✅ AI processes the query and:
  - Provides **text-based insights**.
  - Generates **automated visualizations** if needed.
- ✅ Integration with **local or cloud-based AI models (OpenAI GPT or Llama 2)**.

### **2.3 Real-Time Collaboration & Annotation**
- ✅ Multi-user support with **live annotations on plots**.
- ✅ Shared session where users can **add comments, highlight data points**.
- ✅ **WebSocket-based sync** to ensure real-time updates across clients.
- ✅ Version control for annotations & discussions.

### **2.4 System & Architecture**
- ✅ **Standalone Desktop App (PyQt / PySide) with WebSocket for collaboration**.
- ✅ **Future Proofing for Real-Time ECU Data Support (MCP Integration Later)**.
- ✅ Local **SQLite storage** for logs, annotations.
- ✅ **Export as CSV, JSON, or Report Format**.

## **3. Future Roadmap (Post MVP)**
🚀 **Live ECU Data Support** (via MCP/Vector XCP Integration).  
🚀 **Cloud Collaboration** (optional, for remote teams).  
🚀 **AI-Powered Calibration Suggestions** (advanced ML insights).  

## **4. Tech Stack**
| Component             | Tech Stack |
|----------------------|------------|
| **GUI Framework**     | PyQt / PySide |
| **Data Handling**     | Pandas, NumPy, SciPy (for .mat), asammdf (for .mf4) |
| **Visualization**     | Matplotlib, Plotly |
| **Collaboration**     | WebSockets (asyncio, websockets library) |
| **AI Processing**     | OpenAI API / Llama 2 (for AI queries) |
| **Storage**           | SQLite (for annotations) |
| **Packaging**         | PyInstaller / Docker (optional) |

## **5. Open Source Resources & Useful Links**
### 📂 **GitHub Repositories (Related Projects & Libraries)**
- **MATLAB File Handling**: https://github.com/scipy/scipy (`scipy.io.loadmat`)
- **MDF4 File Handling**: https://github.com/ratal/mdfreader (alternative: https://github.com/asammdf/asammdf)
- **WebSockets for Python**: https://github.com/aaugustin/websockets
- **PyQt GUI Examples**: https://github.com/pyqt/examples
- **OpenAI API for AI Queries**: https://github.com/openai/openai-python

### 🛠️ **Other Useful Tools & Docs**
- **CAN & XCP Protocols**: https://vector.com/en/products/products-a-z/xcp/
- **Python CAN Bus Library**: https://github.com/hardbyte/python-can
- **PyQt Documentation**: https://www.riverbankcomputing.com/static/Docs/PyQt5/

## **6. MCP (Modular Calibration Platform) & Real-Time Considerations**
- **MCP Servers:**
  - Vector’s **VX1000 series** for real-time ECU data acquisition.
  - Open-source alternative: **ETAS INCA with ASAM XCP/CCP**.
  - **CANape by Vector** (Expensive but widely used in industry).

### **Future Consideration for Real-Time MCP Support**
✅ **Integration with CAN, CAN FD, XCP (via python-can & PyXCP)**.  
✅ **Real-time logging for live measurement adjustments**.  
✅ **Streaming from ECU using MQTT/Kafka for live monitoring**.  

## **7. Next Steps**
📌 Start with a **basic PyQt prototype** for **loading, visualizing, and annotating** measurement data.  
📌 Implement **WebSocket-based collaboration** for real-time annotation sync.  
📌 Integrate **AI for basic query handling** (e.g., summarize trends, detect anomalies).  


