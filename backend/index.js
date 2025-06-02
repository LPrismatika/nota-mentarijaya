const express = require("express");
const app = express();
const port = 3000;
const cors = require("cors");
const bodyParser = require("body-parser");
const db = require("./database/db");
const response = require("./response");

app.use(
  cors({
    origin: ["http://localhost:5174", "http://localhost:5173"],
  })
);

app.use(bodyParser.json());

app.get("/", (req, res) => {
  const sql = "SELECT * FROM nota";
  db.query(sql, (error, result) => {
    if (error) return response(400, error, "cannot get data", res);
    response(200, result, "success get all nota", res);
  });
});

// mendapatkan semua deil nota
app.get("/detail-notas", (req, res) => {
  const sql = "SELECT * FROM detail_nota";
  db.query(sql, (error, result) => {
    if (error) return response(400, error, "cannot get data", res);
    response(200, result, "success get all detail-nota", res);
  });
});

// mendapatkan detail sesuai nota id
app.get("/detail-nota/:nota_id", (req, res) => {
  const { nota_id } = req.params;

  if (!nota_id) {
    return response(400, null, "nota_id is required", res);
  }

  const sql = "SELECT * FROM detail_nota WHERE nota_id = ?";
  db.query(sql, [nota_id], (error, result) => {
    if (error) {
      return response(400, error, "Cannot get detail-nota", res);
    }
    if (result.length === 0) {
      return response(404, null, "No details found for this nota_id", res);
    }
    response(200, result, "Success get detail-nota", res);
  });
});

app.get("/nota/next-number", (req, res) => {
  const now = new Date();
  const bulan = String(now.getMonth() + 1).padStart(2, '0');
  const tahun = String(now.getFullYear()).slice(-2);

  const sql = `
    SELECT COUNT(*) AS count FROM nota 
    WHERE MONTH(created_at) = ? AND YEAR(created_at) = ? AND status != 0
  `;

  db.query(sql, [now.getMonth() + 1, now.getFullYear()], (err, results) => {
    if (err) return res.status(500).json({ error: "DB Error" });

    const urutan = (results[0].count || 0) + 1;
    const urutanStr = String(urutan).padStart(3, '0');
    const noNota = `MJ/${tahun}${bulan}/${urutanStr}`;

    res.json({ no_nota: noNota });
  });
});

// edit nota
app.put("/nota/:id", (req, res) => {
  const nota_id = req.params.id;
  const {
    no_nota,
    tanggal,
    pembeli,
    alamat,
    subtotal,
    diskon_persen,
    diskon_rupiah,
    total_harga,
    total_coly,
    jt_tempo,
    details,
  } = req.body;

  db.beginTransaction((err) => {
    if (err) return response(500, err, "Transaction error", res);

    // ✅ 1. Ambil created_at dari nota
    const getCreatedAtSql = "SELECT created_at FROM nota WHERE id = ?";
    db.query(getCreatedAtSql, [nota_id], (errSelect, selectResult) => {
      if (errSelect || selectResult.length === 0) {
        return db.rollback(() => {
          response(
            400,
            errSelect || "Nota not found",
            "Failed to fetch created_at",
            res
          );
        });
      }

      const originalCreatedAt = selectResult[0].created_at;
      function getWIBDatetime6() {
        const now = new Date();
        const offsetMs = 7 * 60 * 60 * 1000; // 7 jam dalam milidetik
        const wibDate = new Date(now.getTime() + offsetMs);
        return wibDate.toISOString().slice(0, 23).replace("T", " ");
      }
      const mysqlDatetime6 = getWIBDatetime6();

      // ✅ 2. Update nota
      const sqlUpdateNota = `
        UPDATE nota SET
          no_nota = ?, tanggal = ?, pembeli = ?, alamat = ?,
          subtotal = ?, diskon_persen = ?, diskon_rupiah = ?,
          total_harga = ?, total_coly = ?, jt_tempo = ?, updated_at = ?
        WHERE id = ?
      `;

      db.query(
        sqlUpdateNota,
        [
          no_nota,
          tanggal,
          pembeli,
          alamat,
          subtotal,
          diskon_persen,
          diskon_rupiah,
          total_harga,
          total_coly,
          jt_tempo,
          mysqlDatetime6,
          nota_id,
        ],
        (error) => {
          if (error) {
            return db.rollback(() => {
              response(400, error, "Failed to update nota", res);
            });
          }

          // ✅ 3. Hapus detail lama
          const deleteDetail = "DELETE FROM detail_nota WHERE nota_id = ?";
          db.query(deleteDetail, [nota_id], (errDelete) => {
            if (errDelete) {
              return db.rollback(() => {
                response(
                  400,
                  errDelete,
                  "Failed to delete old detail nota",
                  res
                );
              });
            }

            // ✅ 4. Insert detail baru pakai created_at lama
            const sqlInsertDetail = `
            INSERT INTO detail_nota
            (nota_id, nama_barang, coly, satuan_coly, qty_isi, nama_isi, jumlah, harga, diskon, total, created_at, updated_at)
            VALUES ?
          `;

            const detailValues = details.map((item) => [
              nota_id,
              item.nama_barang,
              parseFloat(item.coly),
              parseFloat(item.qty_isi),
              parseFloat(item.jumlah),
              parseFloat(item.harga),
              JSON.stringify(item.diskon),
              parseFloat(item.total),
              originalCreatedAt,
              mysqlDatetime6,
            ]);

            db.query(
              sqlInsertDetail,
              [detailValues],
              (errInsert, resultInsert) => {
                if (errInsert) {
                  return db.rollback(() => {
                    response(
                      400,
                      errInsert,
                      "Failed to insert new detail nota",
                      res
                    );
                  });
                }

                db.commit((commitErr) => {
                  if (commitErr) {
                    return db.rollback(() => {
                      response(
                        500,
                        commitErr,
                        "Transaction commit failed",
                        res
                      );
                    });
                  }

                  response(
                    200,
                    {
                      nota_id,
                      detail_updated: resultInsert.affectedRows,
                    },
                    "Nota and detail nota updated successfully",
                    res
                  );
                });
              }
            );
          });
        }
      );
    });
  });
});

// soft-delete, mengubah status jadi 0 ji
app.put("/nota/:id/status", (req, res) => {
  function getWIBDatetime6() {
    const now = new Date();
    const offsetMs = 7 * 60 * 60 * 1000; // 7 jam dalam milidetik
    const wibDate = new Date(now.getTime() + offsetMs);
    return wibDate.toISOString().slice(0, 23).replace("T", " ");
  }
  const mysqlDatetime6 = getWIBDatetime6();
  const { id } = req.params;
  const sql = "UPDATE nota SET status = 0, updated_at = ? WHERE id = ?";
  db.query(sql, [mysqlDatetime6, id], (error, result) => {
    if (error) return response(400, error, "failed to update status", res);
    response(
      200,
      { affectedRows: result.affectedRows },
      "nota status updated to 0",
      res
    );
  });
});

//fungsi cek
app.put("/nota/:id/cek", (req, res) => {
  const { id } = req.params;
  const sql = "UPDATE nota SET cek = 1 WHERE id = ?";
  db.query(sql, [id], (error, result) => {
    if (error) return response(400, error, "Gagal update cek", res);
    response(200, { affectedRows: result.affectedRows }, "Nota berhasil dicek dan siap print", res);
  });
});

//fungsi print
app.put("/nota/:id/print", (req, res) => {
  const { id } = req.params;
  const sql = "UPDATE nota SET print = 1 WHERE id = ?";
  db.query(sql, [id], (error, result) => {
    if (error) return response(400, error, "Gagal update print", res);
    response(200, { affectedRows: result.affectedRows }, "Nota berhasil dicek dan siap print", res);
  });
});

// tambah detail nota(validasi nota_id harus ada)
app.post("/nota", (req, res) => {
  function getWIBDatetime6() {
    const now = new Date();
    const offsetMs = 7 * 60 * 60 * 1000; // 7 jam dalam milidetik
    const wibDate = new Date(now.getTime() + offsetMs);
    return wibDate.toISOString().slice(0, 23).replace("T", " ");
  }
  const mysqlDatetime6 = getWIBDatetime6();

  const {
    no_nota,
    tanggal,
    pembeli,
    alamat,
    subtotal,
    diskon_persen,
    diskon_rupiah,
    total_harga,
    total_coly,
    jt_tempo,
    details,
  } = req.body;

  // Query untuk insert ke tabel nota
  const sqlNota =
    "INSERT INTO nota (no_nota, tanggal, pembeli, alamat, subtotal, diskon_persen, diskon_rupiah, total_harga, total_coly, jt_tempo, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)";

  db.beginTransaction((err) => {
    if (err) return response(500, err, "Transaction error", res);

    db.query(
      sqlNota,
      [
        no_nota,
        tanggal,
        pembeli,
        alamat,
        subtotal,
        diskon_persen,
        diskon_rupiah,
        total_harga,
        total_coly,
        jt_tempo,
        mysqlDatetime6,
        mysqlDatetime6,
      ],
      (error, result) => {
        if (error) {
          return db.rollback(() => {
            response(400, error, "Failed to create nota", res);
          });
        }

        const nota_id = result.insertId; // Dapatkan ID nota yang baru dibuat

        // Query untuk insert ke tabel detail_nota
        const sqlDetail =
          "INSERT INTO detail_nota (nota_id, nama_barang, coly, satuan_coly, qty_isi, nama_isi, jumlah, harga, diskon, total, created_at, updated_at) VALUES ?";

        // Buat array dari details yang dikirim dalam request
        const detailValues = details.map((item) => [
          nota_id,
          item.nama_barang,
          item.coly,
          item.satuan_coly,
          item.qty_isi,
          item.nama_isi,
          item.jumlah,
          item.harga,
          item.diskon,
          item.total,
          mysqlDatetime6,
          mysqlDatetime6,
        ]);

        db.query(sqlDetail, [detailValues], (errDetail, resultDetail) => {
          if (errDetail) {
            return db.rollback(() => {
              response(400, errDetail, "Failed to create detail nota", res);
            });
          }

          // Commit transaksi jika semua berhasil
          db.commit((commitErr) => {
            if (commitErr) {
              return db.rollback(() => {
                response(500, commitErr, "Transaction commit failed", res);
              });
            }
            response(
              201,
              { nota_id, detail_inserted: resultDetail.affectedRows },
              "Nota and detail nota created successfully",
              res
            );
          });
        });
      }
    );
  });
});

//add detail saja 
app.post("/detail-nota", (req, res) => {
  function getWIBDatetime6() {
    const now = new Date();
    const offsetMs = 7 * 60 * 60 * 1000; // 7 jam dalam milidetik
    const wibDate = new Date(now.getTime() + offsetMs);
    return wibDate.toISOString().slice(0, 23).replace("T", " ");
  }
  const mysqlDatetime6 = getWIBDatetime6();

  const {
    notaId,
    nama_barang,
    coly,
    satuan_coly,
    qty_isi,
    nama_isi,
    jumlah,
    harga,
    diskon,
    total
  } = req.body;

  const sql = `
    INSERT INTO detail_nota
    (nota_id, nama_barang, coly, satuan_coly, qty_isi, nama_isi, jumlah, harga, diskon, total, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [notaId, nama_barang, coly, satuan_coly, qty_isi, nama_isi, jumlah, harga, diskon, total, mysqlDatetime6, mysqlDatetime6],
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Insert failed", error: err });
      }

      res.status(201).json({ message: "Detail nota inserted", detail_nota_id: result.insertId });
    }
  );
});


// edit detail nota (validasi nota_id harus ada)
app.put("/detail-nota/:id", (req, res) => {
  function getWIBDatetime6() {
    const now = new Date();
    const offsetMs = 7 * 60 * 60 * 1000; // 7 jam dalam milidetik
    const wibDate = new Date(now.getTime() + offsetMs);
    return wibDate.toISOString().slice(0, 23).replace("T", " ");
  }
  const mysqlDatetime6 = getWIBDatetime6();

  const { id } = req.params;
  const {
    nota_id,
    nama_barang,
    coly,
    satuan_coly,
    qty_isi,
    nama_isi,
    jumlah,
    harga,
    total,
  } = req.body;

  //cek nota_id
  db.query("SELECT id FROM nota WHERE id = ?", [nota_id], (error, result) => {
    if (error || result.length === 0)
      return response(400, "Invalid nota_id", "nota_id not found", res);

    // jika nota_id validn, update data
    const sql =
      "UPDATE detail_nota SET nama_barang = ?, coly = ?, satuan_coly = ?, qty_isi = ?, nama_isi = ?, jumlah = ?, harga = ?, total = ?, updated_at = ? WHERE id = ? AND nota_id = ?";
    db.query(
      sql,
      [
        nama_barang,
        coly,
        satuan_coly,
        qty_isi,
        nama_isi,
        jumlah,
        harga,
        total,
        mysqlDatetime6,
        id,
        nota_id,
      ],
      (err, result) => {
        if (err) return response(400, err, "failed to update detail nota", res);
        response(
          200,
          { affectedRows: result.affectedRows },
          "detail nota updated successfully",
          res
        );
      }
    );
  });
});

app.delete("/detail-nota/:id", (req, res) => {
  const id = req.params.id;

  const sql = "DELETE FROM detail_nota WHERE id = ?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      return response(400, err, "Failed to delete detail nota", res);
    }

    if (result.affectedRows === 0) {
      return response(404, null, "Detail nota not found", res);
    }

    response(200, { deletedId: id }, "Detail nota deleted successfully", res);
  });
});

app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
