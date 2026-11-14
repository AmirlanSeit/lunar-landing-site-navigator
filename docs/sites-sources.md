Проверено 14 ноября 2026 года. 12 записей: 3 Apollo, 3 региона Artemis, 3 цели/посадки CLPS и 3 международные посадки.

Координаты в градусах: lat > 0 — север, lat < 0 — юг; lon_east и JSON lon — восточная долгота в диапазоне [0, 360). Западная долгота переведена по формуле lon_east = (lon_signed + 360) % 360. Все альтернативные пары в note также записаны как (lat, lon_east).

Artemis: названия трех регионов подтверждены [официальным списком NASA от 28.10.2024](https://www.nasa.gov/news-release/nasa-provides-update-on-artemis-iii-moon-landing-regions/); числа взяты из научной статьи, а не назначены NASA как точки посадки. Это опубликованные опорные точки регионов, не точные границы и не утвержденные места посадки. Альтернативные координаты из нерецензированного препринта сохранены отдельно. Они могут относиться к разным опорным точкам одной области; усреднять их не следует.

Название Artemis III в mission обозначает исторический список 2024 года: в [архитектуре NASA 2026 года](https://www.nasa.gov/missions/artemis/nasas-artemis-iii-mission-to-test-future-moon-lander-operations/) Artemis III является демонстрацией на околоземной орбите.

elev_m — опубликованная высота в метрах. Высоты не приводились к единому датуму; совместимость вертикальной системы каждого источника с выбранной DEM необходимо проверить перед расчетами. null означает отсутствие проверенного значения; note содержит unverified. source — массив URL: источник основных координат первым, затем подтверждения и альтернативы.

| id | name | lat | lon_east | elev_m | category | mission | source_url | note |
|---|---|---:|---:|---:|---|---|---|---|
| apollo_11 | Apollo 11 — LM | 0.67416 | 23.47314 | -1926 | apollo_landed | Apollo 11 | [LROC 2016](https://www.lroc.asu.edu/data/support/downloads/2016_LROC_Coordinates_of_Human_Features.pdf); [NASA](https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_sites.html); [ALSJ: Davies 1987](https://www.apollojournals.org/alsj/alsjcoords.html) | LROC, ME/DE421. Старое решение Davies 1987: (0.67409, 23.47298); не усреднять. |
| apollo_15 | Apollo 15 — LM | 26.13239 | 3.6333 | -1931 | apollo_landed | Apollo 15 | [LROC 2016](https://www.lroc.asu.edu/data/support/downloads/2016_LROC_Coordinates_of_Human_Features.pdf); [NASA](https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_sites.html); [ALSJ: Davies 1987](https://www.apollojournals.org/alsj/alsjcoords.html) | LROC, ME/DE421. Старое решение Davies 1987: (26.13224, 3.63400); не усреднять. |
| apollo_17 | Apollo 17 — LM | 20.1911 | 30.7723 | -2626 | apollo_landed | Apollo 17 | [LROC 2016](https://www.lroc.asu.edu/data/support/downloads/2016_LROC_Coordinates_of_Human_Features.pdf); [NASA](https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_sites.html); [ALSJ: Davies 1987](https://www.apollojournals.org/alsj/alsjcoords.html) | LROC, ME/DE421. Старое решение Davies 1987: (20.18809, 30.77475); не усреднять. |
| artemis_haworth | Haworth — опорная точка региона | -86.75 | 337.2 | null | artemis_region_reference | Artemis III — список NASA 2024 | [Статья, Table 1](https://www.mdpi.com/2072-4292/17/9/1579); [NASA 2024](https://www.nasa.gov/news-release/nasa-provides-update-on-artemis-iii-moon-landing-regions/); [Препринт, Table 4](https://www.preprints.org/manuscript/202511.1488) | Точка из Table 1 статьи, не утвержденная посадка. Альтернатива: (-86.753, 337.164), препринт, Table 4. elev_m: unverified. |
| artemis_nobile_rim_1 | Nobile Rim 1 — опорная точка региона | -85.42 | 37.38 | null | artemis_region_reference | Artemis III — список NASA 2024 | [Статья, Table 1](https://www.mdpi.com/2072-4292/17/9/1579); [NASA 2024](https://www.nasa.gov/news-release/nasa-provides-update-on-artemis-iii-moon-landing-regions/); [Препринт, Table 4](https://www.preprints.org/manuscript/202511.1488) | Точка из Table 1 статьи, не утвержденная посадка. Альтернатива: (-85.431, 37.241), препринт, Table 4. elev_m: unverified. |
| artemis_nobile_rim_2 | Nobile Rim 2 — опорная точка региона | -83.93 | 58.83 | null | artemis_region_reference | Artemis III — список NASA 2024 | [Статья, Table 1](https://www.mdpi.com/2072-4292/17/9/1579); [NASA 2024](https://www.nasa.gov/news-release/nasa-provides-update-on-artemis-iii-moon-landing-regions/); [Препринт, Table 4](https://www.preprints.org/manuscript/202511.1488) | Точка из Table 1 статьи, не утвержденная посадка. Альтернатива: (-83.963, 58.654), препринт, Table 4. elev_m: unverified. |
| viper_mons_mouton_target | Mons Mouton — проектная цель VIPER | -85.4451243175 | 30.9437378907 | null | clps_historical_target | VIPER — прежняя программа CLPS | [NASA, §5.2](https://assets.science.nasa.gov/content/dam/science/psd/lunar-science/documents/VIPER_Technical_Information_AFPP.pdf) | NASA DRAFT, §5.2, PDF с. 6–7; система ME. Цель прежней программы, не результат посадки. elev_m: unverified. |
| im_1_odysseus | IM-1 Odysseus — фактическая посадка | -80.1276 | 1.4367 | 2579 | clps_landed | Intuitive Machines IM-1 | [NASA/JPL](https://www.nasa.gov/wp-content/uploads/2026/02/42-240a.pdf); [NASA/LRO](https://www.nasa.gov/missions/lro/nasas-lro-images-intuitive-machines-odysseus-lander/) | JPL, PDF с. 28–29. NASA/LRO округляет до (-80.13, 1.44). Плановая точка в JPL: (-80.18, 0.98), 2705 м. |
| im_2_athena | IM-2 Athena — Mons Mouton | -84.7906 | 29.1957 | 5321 | clps_landed | Intuitive Machines IM-2 | [LROC](https://lroc.im-ldi.com/featured_sites/im2/flip-book) | Фактическое положение по LROC: аппарат оказался на боку в кратере диаметром 20 м. |
| chandrayaan_3 | Chandrayaan-3 — Vikram / Shiv Shakti | -69.373 | 32.319 | 529.2 | international_landed | Chandrayaan-3 / ISRO | [NASA/JPL](https://www.nasa.gov/wp-content/uploads/2026/02/42-240a.pdf); [ISRO: план](https://www.isro.gov.in/ISRO_EN/Chandrayaan3_Details.html); [LPSC 1411](https://www.hou.usra.edu/meetings/lpsc2024/pdf/1411.pdf) | Факт и высота: JPL, PDF с. 25; датум высоты: unverified. План ISRO: (-69.367621, 32.348126). LPSC 1411 дает 31.319°E: конфликт, не использовано. |
| change_4 | Chang'e-4 — Statio Tianhe | -45.4562 | 177.5885 | -5927 | international_landed | Chang'e-4 / CNSA | [LROC 2020](https://lroc.im-ldi.com/images/1168); [LROC 2019](https://lroc.im-ldi.com/images/1100); [Liu et al. 2019](https://www.nature.com/articles/s41467-019-12278-3) | LROC 2020: ±13 м (95%). Высота из LROC 2019, где lat=-45.4561. Liu et al. 2019: (-45.4446, 177.5991), -5935 м; другое картографическое решение. |
| slim | SLIM — у кратера Shioli | -13.316 | 25.251 | -912 | international_landed | SLIM / JAXA | [NASA/LRO](https://www.nasa.gov/missions/lro/nasas-lro-spots-japans-moon-lander/); [JAXA: цель](https://global.jaxa.jp/press/2024/01/file/jaxa_doc01_20240125_e.pdf) | Фактическая посадка по NASA/LRO. Цель JAXA: (-13.31549, 25.24889); это плановая точка, а не альтернативное измерение посадки. |

Тот же список в JSON:

```json
[
  {
    "id": "apollo_11",
    "name": "Apollo 11 — LM",
    "lat": 0.67416,
    "lon": 23.47314,
    "elev_m": -1926,
    "category": "apollo_landed",
    "mission": "Apollo 11",
    "source": [
      "https://www.lroc.asu.edu/data/support/downloads/2016_LROC_Coordinates_of_Human_Features.pdf",
      "https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_sites.html",
      "https://www.apollojournals.org/alsj/alsjcoords.html"
    ],
    "note": "LROC, ME/DE421. Старое решение Davies 1987: (0.67409, 23.47298); не усреднять."
  },
  {
    "id": "apollo_15",
    "name": "Apollo 15 — LM",
    "lat": 26.13239,
    "lon": 3.6333,
    "elev_m": -1931,
    "category": "apollo_landed",
    "mission": "Apollo 15",
    "source": [
      "https://www.lroc.asu.edu/data/support/downloads/2016_LROC_Coordinates_of_Human_Features.pdf",
      "https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_sites.html",
      "https://www.apollojournals.org/alsj/alsjcoords.html"
    ],
    "note": "LROC, ME/DE421. Старое решение Davies 1987: (26.13224, 3.63400); не усреднять."
  },
  {
    "id": "apollo_17",
    "name": "Apollo 17 — LM",
    "lat": 20.1911,
    "lon": 30.7723,
    "elev_m": -2626,
    "category": "apollo_landed",
    "mission": "Apollo 17",
    "source": [
      "https://www.lroc.asu.edu/data/support/downloads/2016_LROC_Coordinates_of_Human_Features.pdf",
      "https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_sites.html",
      "https://www.apollojournals.org/alsj/alsjcoords.html"
    ],
    "note": "LROC, ME/DE421. Старое решение Davies 1987: (20.18809, 30.77475); не усреднять."
  },
  {
    "id": "artemis_haworth",
    "name": "Haworth — опорная точка региона",
    "lat": -86.75,
    "lon": 337.2,
    "elev_m": null,
    "category": "artemis_region_reference",
    "mission": "Artemis III — список NASA 2024",
    "source": [
      "https://www.mdpi.com/2072-4292/17/9/1579",
      "https://www.nasa.gov/news-release/nasa-provides-update-on-artemis-iii-moon-landing-regions/",
      "https://www.preprints.org/manuscript/202511.1488"
    ],
    "note": "Точка из Table 1 статьи, не утвержденная посадка. Альтернатива: (-86.753, 337.164), препринт, Table 4. elev_m: unverified."
  },
  {
    "id": "artemis_nobile_rim_1",
    "name": "Nobile Rim 1 — опорная точка региона",
    "lat": -85.42,
    "lon": 37.38,
    "elev_m": null,
    "category": "artemis_region_reference",
    "mission": "Artemis III — список NASA 2024",
    "source": [
      "https://www.mdpi.com/2072-4292/17/9/1579",
      "https://www.nasa.gov/news-release/nasa-provides-update-on-artemis-iii-moon-landing-regions/",
      "https://www.preprints.org/manuscript/202511.1488"
    ],
    "note": "Точка из Table 1 статьи, не утвержденная посадка. Альтернатива: (-85.431, 37.241), препринт, Table 4. elev_m: unverified."
  },
  {
    "id": "artemis_nobile_rim_2",
    "name": "Nobile Rim 2 — опорная точка региона",
    "lat": -83.93,
    "lon": 58.83,
    "elev_m": null,
    "category": "artemis_region_reference",
    "mission": "Artemis III — список NASA 2024",
    "source": [
      "https://www.mdpi.com/2072-4292/17/9/1579",
      "https://www.nasa.gov/news-release/nasa-provides-update-on-artemis-iii-moon-landing-regions/",
      "https://www.preprints.org/manuscript/202511.1488"
    ],
    "note": "Точка из Table 1 статьи, не утвержденная посадка. Альтернатива: (-83.963, 58.654), препринт, Table 4. elev_m: unverified."
  },
  {
    "id": "viper_mons_mouton_target",
    "name": "Mons Mouton — проектная цель VIPER",
    "lat": -85.4451243175,
    "lon": 30.9437378907,
    "elev_m": null,
    "category": "clps_historical_target",
    "mission": "VIPER — прежняя программа CLPS",
    "source": [
      "https://assets.science.nasa.gov/content/dam/science/psd/lunar-science/documents/VIPER_Technical_Information_AFPP.pdf"
    ],
    "note": "NASA DRAFT, §5.2, PDF с. 6–7; система ME. Цель прежней программы, не результат посадки. elev_m: unverified."
  },
  {
    "id": "im_1_odysseus",
    "name": "IM-1 Odysseus — фактическая посадка",
    "lat": -80.1276,
    "lon": 1.4367,
    "elev_m": 2579,
    "category": "clps_landed",
    "mission": "Intuitive Machines IM-1",
    "source": [
      "https://www.nasa.gov/wp-content/uploads/2026/02/42-240a.pdf",
      "https://www.nasa.gov/missions/lro/nasas-lro-images-intuitive-machines-odysseus-lander/"
    ],
    "note": "JPL, PDF с. 28–29. NASA/LRO округляет до (-80.13, 1.44). Плановая точка в JPL: (-80.18, 0.98), 2705 м."
  },
  {
    "id": "im_2_athena",
    "name": "IM-2 Athena — Mons Mouton",
    "lat": -84.7906,
    "lon": 29.1957,
    "elev_m": 5321,
    "category": "clps_landed",
    "mission": "Intuitive Machines IM-2",
    "source": [
      "https://lroc.im-ldi.com/featured_sites/im2/flip-book"
    ],
    "note": "Фактическое положение по LROC: аппарат оказался на боку в кратере диаметром 20 м."
  },
  {
    "id": "chandrayaan_3",
    "name": "Chandrayaan-3 — Vikram / Shiv Shakti",
    "lat": -69.373,
    "lon": 32.319,
    "elev_m": 529.2,
    "category": "international_landed",
    "mission": "Chandrayaan-3 / ISRO",
    "source": [
      "https://www.nasa.gov/wp-content/uploads/2026/02/42-240a.pdf",
      "https://www.isro.gov.in/ISRO_EN/Chandrayaan3_Details.html",
      "https://www.hou.usra.edu/meetings/lpsc2024/pdf/1411.pdf"
    ],
    "note": "Факт и высота: JPL, PDF с. 25; датум высоты: unverified. План ISRO: (-69.367621, 32.348126). LPSC 1411 дает 31.319°E: конфликт, не использовано."
  },
  {
    "id": "change_4",
    "name": "Chang'e-4 — Statio Tianhe",
    "lat": -45.4562,
    "lon": 177.5885,
    "elev_m": -5927,
    "category": "international_landed",
    "mission": "Chang'e-4 / CNSA",
    "source": [
      "https://lroc.im-ldi.com/images/1168",
      "https://lroc.im-ldi.com/images/1100",
      "https://www.nature.com/articles/s41467-019-12278-3"
    ],
    "note": "LROC 2020: ±13 м (95%). Высота из LROC 2019, где lat=-45.4561. Liu et al. 2019: (-45.4446, 177.5991), -5935 м; другое картографическое решение."
  },
  {
    "id": "slim",
    "name": "SLIM — у кратера Shioli",
    "lat": -13.316,
    "lon": 25.251,
    "elev_m": -912,
    "category": "international_landed",
    "mission": "SLIM / JAXA",
    "source": [
      "https://www.nasa.gov/missions/lro/nasas-lro-spots-japans-moon-lander/",
      "https://global.jaxa.jp/press/2024/01/file/jaxa_doc01_20240125_e.pdf"
    ],
    "note": "Фактическая посадка по NASA/LRO. Цель JAXA: (-13.31549, 25.24889); это плановая точка, а не альтернативное измерение посадки."
  }
]
```

Для расчета освещенности и прямой видимости Земли одного положения точки и высоты недостаточно: нужен рельеф вокруг точки, высота панели/антенны над поверхностью и выбранное время. Для полярных DEM см. [NASA PGDA](https://pgda.gsfc.nasa.gov/products/78). Для Chang'e-4 на обратной стороне ожидается отсутствие прямой связи с Землей; площадка полезна как контрольный пример.

