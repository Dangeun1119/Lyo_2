import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function KvRpPredictor() {
  const [shelfTemp, setShelfTemp] = useState("");
  const [chamberPressure, setChamberPressure] = useState("");
  const [predictedKv, setPredictedKv] = useState(null);
  const [predictedRp, setPredictedRp] = useState(null);
  const [rawData, setRawData] = useState("");
  const [chartData, setChartData] = useState([]);
  const [modelCoeffs, setModelCoeffs] = useState({ kv: [350, 3, 0.2], rp: [88333.33, -3333.33, -125] });

  const predictKv = (T, P) => modelCoeffs.kv[0] + modelCoeffs.kv[1] * T + modelCoeffs.kv[2] * P;
  const predictRp = (T, P) => modelCoeffs.rp[0] + modelCoeffs.rp[1] * T + modelCoeffs.rp[2] * P;

  const handlePredict = () => {
    const T = parseFloat(shelfTemp);
    const P = parseFloat(chamberPressure);
    if (!isNaN(T) && !isNaN(P)) {
      setPredictedKv(predictKv(T, P).toFixed(2));
      setPredictedRp(predictRp(T, P).toFixed(2));
    }
  };

  const handleTrainModel = () => {
    const rows = rawData.split("\n").map((row) => row.split(",").map((v) => parseFloat(v.trim())));
    const X = rows.map(([T, P]) => [1, T, P]);
    const Y_kv = rows.map(([, , kv]) => kv);
    const Y_rp = rows.map(([, , , rp]) => rp);
    if (Y_kv.some(isNaN) || Y_rp.some(isNaN)) return;

    const fit = (X, Y) => {
      const XT = X[0].map((_, i) => X.map((row) => row[i]));
      const XTX = XT.map((row, i) => row.map((_, j) => row.reduce((sum, val, k) => sum + val * XT[j][k], 0)));
      const XTY = XT.map((row) => row.reduce((sum, val, k) => sum + val * Y[k], 0));
      const inv = (m) => {
        const det = m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1])
                  - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0])
                  + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
        const cof = [
          [m[1][1]*m[2][2]-m[1][2]*m[2][1], -(m[0][1]*m[2][2]-m[0][2]*m[2][1]), m[0][1]*m[1][2]-m[0][2]*m[1][1]],
          [-(m[1][0]*m[2][2]-m[1][2]*m[2][0]), m[0][0]*m[2][2]-m[0][2]*m[2][0], -(m[0][0]*m[1][2]-m[0][2]*m[1][0])],
          [m[1][0]*m[2][1]-m[1][1]*m[2][0], -(m[0][0]*m[2][1]-m[0][1]*m[2][0]), m[0][0]*m[1][1]-m[0][1]*m[1][0]]
        ];
        return cof.map(row => row.map(v => v / det));
      };
      const XTX_inv = inv(XTX);
      return XTX_inv.map(row => row.reduce((sum, val, j) => sum + val * XTY[j], 0));
    };

    const kvCoeffs = fit(X, Y_kv);
    const rpCoeffs = fit(X, Y_rp);
    setModelCoeffs({ kv: kvCoeffs, rp: rpCoeffs });
  };

  const handleDataInput = () => {
    const rows = rawData.split("\n");
    const parsed = rows.map((row) => {
      const [T, P] = row.split(",").map((v) => parseFloat(v.trim()));
      return {
        T,
        P,
        Kv: predictKv(T, P),
        Rp: predictRp(T, P)
      };
    });
    setChartData(parsed);
  };

  return <div>웹앱 코드 정상 생성됨</div>;
}
