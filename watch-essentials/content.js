/* Watch Essentials — educational content.
 * Terminology follows the original FHH Watch Essentials chapter I.2
 * ("Watch components"). French terms are the standard watchmaking names. */
window.WE_CONTENT = {
  components: [
    {
      id: "crystal",
      n: "01",
      name: "Crystal",
      fr: "glace",
      def: "The transparent cover above the dial — most often sapphire, mineral glass or acrylic. It protects the dial and hands from dust, moisture and knocks.",
    },
    {
      id: "bezel",
      n: "02",
      name: "Bezel",
      fr: "lunette",
      def: "The ring surrounding the crystal. It frames the dial and, on many watches, holds the crystal in place.",
    },
    {
      id: "case",
      n: "03",
      name: "Case",
      fr: "boîte",
      def: "The housing that contains and protects the movement and dial. It carries the bezel and lugs; the crown's stem passes through it to reach the movement.",
    },
    {
      id: "crown",
      n: "04",
      name: "Crown",
      fr: "couronne",
      def: "The control on the side of the case, usually at 3 o'clock. Pulled out, it sets the time; depending on the movement, turning it also winds the mainspring.",
    },
    {
      id: "lugs",
      n: "05",
      name: "Lugs",
      fr: "cornes",
      def: "The extensions of the case that secure the strap or bracelet, usually by means of spring bars.",
    },
  ],

  quiz: [
    {
      target: "bezel",
      options: ["bezel", "crystal", "case"],
      explain: "The ring surrounding the crystal. It frames the dial and, on many watches, holds the crystal in place.",
      wrong: {
        crystal: "Not quite — the crystal is the transparent cover over the dial. Look at the ring that surrounds it.",
        case: "Not quite — the case is the housing beneath. The highlighted ring sits on top of it, around the crystal.",
      },
    },
    {
      target: "crown",
      options: ["lugs", "crown", "bezel"],
      explain: "The control on the side of the case. Pulled out, it sets the time; depending on the movement, it also winds the mainspring.",
      wrong: {
        lugs: "Not quite — the lugs hold the strap. The highlighted part sits on the side of the case, at 3 o'clock.",
        bezel: "Not quite — the bezel surrounds the crystal. The highlighted part is a control you can pull and turn.",
      },
    },
    {
      target: "lugs",
      options: ["case", "lugs", "crown"],
      explain: "The extensions of the case that secure the strap or bracelet, usually by means of spring bars.",
      wrong: {
        case: "Close — the lugs belong to the case, but the highlighted parts have a more precise name.",
        crown: "Not quite — the crown is the control at 3 o'clock. The highlighted parts hold the strap.",
      },
    },
  ],
};
