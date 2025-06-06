import { StyleSheet } from "@react-pdf/renderer";

export const styles = StyleSheet.create({
  text: {
    fontFamily: 'MartianMono',
  },
  page: {
    flexDirection: "column",
    backgroundColor: "#fff",
    padding: 10,
    fontSize: 8,
    paddingBottom: 30,
    position: "relative",
    textTransform: "uppercase",
  },
  head: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 15,
    marginTop: 10,
    fontWeight: "bold",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
    marginTop: 2,
    marginLeft: 10,
    // fontWeight: "bold",
  },
  headerKanan: {
    width: "35%",
    alignItems: "flex-start",
    // marginRight: 20
    // paddingLeft: 20,
  },
  title: {
    alignSelf: "center",
    textDecoration: "underline",
    fontSize: 10,
    marginRight: 130,
  },
  image: {
    width: 100,
    height: "auto",
    marginRight: 70,
  },

  footer: {
    position: "absolute",
    bottom: 2,
    marginBottom: 20,
    // left: 20,
    // right: 15,
    // fontWeight: "bold",
    // fontSize: 7.5
    borderStyle: "solid",
    borderTopWidth: 1,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  priceRowTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
    fontWeight: "bold",
  },
  space: {
    whiteSpace: "pre",
  },
  label: {
    width: "40%",
  },
  value: {
    width: "60%",
    marginLeft: "5px",
    textAlign: "left",
  },
  //   tLeft: {
  //     width: 250,
  //     marginTop: 10,
  //     marginLeft: 5,
  //     height: "45",
  //     fontWeight: 800,
  //     fontSize: 11
  //   },
  // tRight: {
  //   fontWeight: 800,
  //   fontSize: 11,
  //   textAlign: "right",
  //   paddingRight: 30,
  // },
  brand: {
    fontWeight: 800,
    fontSize: 11,
    marginLeft: 20,
  }
});
