import { styles } from "./style";
import { Table as Tabel, TR, TH, TD } from "@ag-media/react-pdf-table";
import MartianMonoBold from "@/assets/font/NotoSans-Bold.ttf";
import MartianMonoMedium from "@/assets/font/NotoSans-Medium.ttf";
import {
  Document,
  Page,
  View,
  Text,  
  Font,
  PDFViewer,
} from "@react-pdf/renderer";
import { useParams } from "react-router-dom";
import { useGetAllNota, useGetDetailNota } from "@/services/queries";

Font.register({
  family: "MartianMono",
  fonts: [{ src: MartianMonoBold, fontWeight: "bold" }, { src: MartianMonoMedium}],
});
const MAX_ITEM_PER_PAGE = 10;

const PrintNota = () => {

  const formatDate = (date: string) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const chunkArray = (array: any[], size: number) => {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  };

  const { notaId } = useParams();
  const parsedNotaId = notaId ? Number(notaId) : undefined;
  const { data: notaList } = useGetAllNota();
  const { data: details } = useGetDetailNota(parsedNotaId!);

  const nota = notaList?.find((n) => n.id === parsedNotaId);

  // JANGAN render PDF sebelum data lengkap
  if (!nota || !details) return <div>Loading...</div>;

  const detailPages = chunkArray(details, MAX_ITEM_PER_PAGE);

  const columns = [
    {
      label: "NO",
      styling: { justifyContent: "center" },
      width: "5%",
      stylingTD: { justifyContent: "center" },
      render: (_item: any, index: number, pageIndex: number) =>
        pageIndex * MAX_ITEM_PER_PAGE + index + 1,
    },
    {
      label: "NAMA BARANG",
      styling: { justifyContent: "flex-start" },
      // stylingTD: { fontWeight: "bold" },
      width: "25%",
      key: "nama_barang",
    },
    {
      label: "COLY",
      width: "15%",
      styling: { justifyContent: "flex-start", paddingLeft: "18px" },
      // stylingTD: { fontWeight: "bold" },
      render: (item: any) => (
        <View style={{ flexDirection: "row", width: "100%" }}>
          <Text style={{ width: 20, textAlign: "right" }}>{parseFloat(item.coly)}</Text>
          <Text style={{ marginLeft: 2 }}>{item.satuan_coly}</Text>
        </View>
      ),
    },
    {
      label: "ISI",
      width: "15%",
      styling: { justifyContent: "flex-start", paddingLeft: "18px" },
      // stylingTD: { fontWeight: "bold" },
      render: (item: any) => (
        <View style={{ flexDirection: "row", width: "100%" }}>
          {/* <Text style={{ width: 5, textAlign: "right" }}>@ </Text> */}
          <Text style={{ width: 20, textAlign: "right" }}>{parseFloat(item.qty_isi)}</Text>
          <Text style={{ marginLeft: 2 }}>{item.nama_isi}</Text>
        </View>
      ),
    },
    {
      label: "TOTAL QTY",
      width: "15%",
      styling: { justifyContent: "flex-start" },
      // stylingTD: { fontWeight: "bold" },
      render: (item: any) => (
        <View style={{ flexDirection: "row", width: "100%" }}>
          <Text style={{ width: 22, textAlign: "right" }}>{parseFloat(item.jumlah)}</Text>
          <Text style={{ marginLeft: 2 }}> {item.nama_isi}</Text>
        </View>
      ),
    },
    {
      label: "HARGA",
      width: "10%",
      styling: { justifyContent: "flex-end", paddingRight: "8px" },
      // stylingTD: { fontWeight: "bold" },
      render: (item: any) => (
        <View style={{ flexDirection: "row" }}>
          <Text style={{ width: "100%", textAlign: "right" }}>
            {item.harga.toLocaleString()}
          </Text>
        </View>
      ),
    },
    {
      label: "% Disc",
      styling: { justifyContent: "flex-end" },
      // stylingTD: { display: "flex", justifyContent: "center" },
      width: "5%",
      render: (item: any) => (
        <View style={{ flexDirection: "row"}}>
          <Text style={{ width: "100%", textAlign: "center", paddingLeft: 20 }}>
            {Array.isArray(JSON.parse(item.diskon)) && JSON.parse(item.diskon).length > 0 ? JSON.parse(item.diskon).join("+") : "0"}
          </Text>
        </View>
      ),
    },
    {
      label: "SUBTOTAL",
      width: "10%",
      styling: { justifyContent: "flex-end" },
      // stylingTD: { fontWeight: "bold" },
      render: (item: any) => (
        <View style={{ flexDirection: "row" }}>
          <Text style={{ width: "100%", textAlign: "right" }}>
            {item.total.toLocaleString()}
          </Text>
        </View>
      ),
    },
  ];

  const NotaPDF = () => (
    <Document style={styles.text}>
      {detailPages.map((page, pageIndex) => (
        <Page
          size={{ width: "135mm", height: "200mm" }}
          orientation="landscape"
          style={styles.page}
          key={pageIndex}
        >
          <View style={styles.head}>
            <View style={styles.brand}>
              <Text style={{ marginBottom: 2 }}>MENTARI JAYA</Text>
              <Text>SURABAYA</Text>
            </View>
            <Text style={styles.title}>FAKTUR</Text>
            <Text></Text>
          </View>

          <View style={styles.header}>
            <View>
              <View>
                {[
                  ["No Nota", nota.no_nota],
                  ["Tanggal", formatDate(nota.tanggal)],
                  ["Tanggal J/T", formatDate(nota.jt_tempo)],
                ].map(([label, value], index) => (
                  <View
                    key={index}
                    style={{ flexDirection: "row", marginBottom: 4 }}
                  >
                    <View style={{ width: 80 }}>
                      <Text>{label}</Text>
                    </View>
                    <View style={{ width: 10 }}>
                      <Text>:</Text>
                    </View>
                    <View>
                      <Text>{value}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.headerKanan}>
              <Text>Kepada, Yth</Text>
              {[[nota.pembeli], [nota.alamat]].map((value, index) => (
                <View
                  key={index}
                  style={{ flexDirection: "row", marginTop: 3 }}
                >
                  <View style={{ width: 80 }}>
                    <Text>{value}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <Tabel
            tdStyle={{ padding: "2px", border: "0px" }}
            weightings={[0.03, 0.33, 0.1, 0.11, 0.11, 0.11, 0.1, 0.11]}
          >
            <TH
              style={{
                borderTop: "1px solid black",
                borderBottom: "1px solid black",
                paddingTop: "1.5px",
                paddingBottom: "1.5px",
                fontWeight: "normal"
              }}
            >
              {columns.map((col, i) => (
                <TD key={i} style={col.styling}>
                  {col.label}
                </TD>
              ))}
            </TH>
            {page.map((item, index) => (
              <TR key={index}>
                {columns.map((col, colIndex) => {
                  const content = col.render
                    ? col.render(item, index, pageIndex)
                    : item[col.key];

                  return (
                    <TD key={colIndex} style={col.stylingTD}>
                      {content}
                    </TD>
                  );
                })}
              </TR>
            ))}
          </Tabel>

          <View
            style={{
              borderStyle: "solid",
              borderTopWidth: 1,
              position: "absolute",
              bottom: 50,
            }}
          ></View>
          {pageIndex === detailPages.length - 1 && (
            <View style={styles.footer}>
              <View
                style={{
                  marginTop: 3,
                  width: "100%",
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                {/* Kolom 1: Hormat Kami */}
                <View style={{ width: "20%" }}>
                  <Text>HORMAT KAMI,</Text>
                  <Text style={{ marginBottom: 40 }}></Text>
                  <Text style={styles.space}>(                                    )</Text>
                </View>

                {/* Kolom 2: Info Transfer */}
                <View style={{ width: "47%", textAlign: "center", fontWeight: "bold" }}>
                  <Text style={{ marginBottom: 2 }}>
                    BILA SUDAH JATUH TEMPO
                  </Text>
                  <Text style={{ marginBottom: 2 }}>MOHON TRANSFER KE :</Text>
                  <Text style={{ marginBottom: 2 }}>BCA : 506 082 9499</Text>
                  <Text style={{ marginBottom: 2 }}>
                    BRI : 0587 0100 1434 535
                  </Text>
                  <Text style={{ marginBottom: 2 }}>A/N : GO GIOK LIE</Text>
                  <Text style={{ marginBottom: 3 }}>TERIMA KASIH</Text>
                </View>

                {/* Kolom 3: Harga */}
                <View style={{ width: "29%" }}>
                  <View style={styles.priceRow}>
                    <Text style={styles.label}>SUBTOTAL</Text>
                    <Text style={{ marginLeft: 3 }}>:</Text>
                    <Text style={styles.value}>
                      Rp. {nota.subtotal.toLocaleString("id-ID", {maximumFractionDigits: 2})}
                    </Text>
                  </View>
                  <View style={styles.priceRow}>
                    <Text style={styles.label}>DISKON {nota.diskon_persen.toFixed(0)} %</Text>
                    <Text style={{ marginLeft: 3 }}>:</Text>
                    <Text style={styles.value}>Rp. {nota.diskon_rupiah}</Text>
                  </View>
                  <View style={styles.priceRowTotal}>
                    <Text style={styles.label}>TOTAL</Text>
                    <Text style={{ marginLeft: 3 }}>:</Text>
                    <Text style={styles.value}>
                      Rp. {nota.total_harga.toLocaleString("id-ID", {maximumFractionDigits: 2})}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </Page>
      ))}
    </Document>
  );

  return (
    <div className="place-content-center m-0">
      <div
        id="print-area"
        className="print-area a6-landscape"
        style={{ height: "100vh" }}
      >
        <PDFViewer width="100%" height="100%">
          <NotaPDF />
        </PDFViewer>
      </div>
    </div>
  );
};

export default PrintNota;
