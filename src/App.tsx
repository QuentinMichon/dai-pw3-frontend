import {useEffect, useState} from 'react'
import './App.css'
import type {Aircraft, Company_t} from "./types/types.ts";
import 'react-toastify/dist/ReactToastify.css'; // pour les toasts
import {toast} from "react-toastify";


function App() {

    //const HOSTNAME : string = "localhost";
    const HOSTNAME : string = "api.dai.swisspotter.ch";

    const [companyFilter, setCompanyFilter] = useState<string>();       // Constructeur filtre de catalogue
    const [allCompanies, setAllCompanies] = useState<string[]>([]);   // Toute les companies présentes dans le catalogue (chargé qu'une fois)
    const [catalogueAircraft, setCatalogueAircraft] = useState<Aircraft[]>([]); // tous les avions à afficher dans le catalogue
    const [companies, setCompanies] = useState<Company_t[]>([]);    // toutes les compagnies
    const [selectedAircraftICAO, setSelectedAircraftICAO] = useState<string>("");

    const [form, setForm] = useState<Aircraft>({
        ICAO: "",
        constructor: "",
        maxCapacity: 0,
        range: 0
    });

    const uniqueConstructors = ["ALL", ...Array.from(new Set(allCompanies))];

    const reloadAircraft = async () => {
        const res = await fetch(`https://${HOSTNAME}/avions?sort=icao&sort=constructor`);

        if(!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }

        const dataAvions: Aircraft[] = await res.json();

        setAllCompanies(dataAvions.map(a => a.constructor));
        setCatalogueAircraft(dataAvions);
        setCompanyFilter(uniqueConstructors[0])
    }

    const reloadCompanies = async () => {
        const res = await fetch(`https://${HOSTNAME}/company?sort=name`);

        if(res.status != 200) {
            throw new Error(`HTTP ${res.status}`);
        }

        const dataCompanies: Company_t[] = await res.json();
        setCompanies(dataCompanies);
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleSelectCard = async (icao : string) => {
        setSelectedAircraftICAO(icao);
    }

    const deleteAircraft = async (ICAO: string) => {
        const response = await fetch(`https://${HOSTNAME}/avions?icao=${ICAO}`, { method: "DELETE" });

        if (response.status >= 200 && response.status < 300) {
            toast.success(`${response.status} : ${response.statusText} \n Aircraft ${ICAO} have been deleted`);
            await reloadAircraft();
        } else {
            toast.error(`${response.status} : ${response.statusText}`);
        }
    }

    const postNewAircraft = async () => {
        const response = await fetch(`https://${HOSTNAME}/avions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(form),
        });


        const status = response.status;

        if(status >= 200 && status < 300) {
            toast.success(`Status ${status} : created`);
        } else {
            toast.error(`Status ${status} : ${response.statusText} \n ${await response.text()}`);
        }

        await reloadAircraft();
    }

    const buyAircraft = async (cmpICAO: string, ICAO: string) => {
        const response = await fetch(`https://${HOSTNAME}/company/${cmpICAO}/buy?aircraftICAO=${ICAO}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            }
        });

        if (response.status != 202) {
            toast.error(`Status ${response.status} : ${response.statusText}\n ${await response.text()}`);
        } else {
            await reloadCompanies();
            toast.success(`${response.status} : ${response.statusText} | Buy one ${ICAO} for ${cmpICAO}`);
        }
    }

    const sellAircraft = async (cmpICAO: string, ICAO: string) => {
        const res = await fetch(`https://${HOSTNAME}/company/${cmpICAO}/sell?aircraftICAO=${ICAO}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            }
        });

        if (res.status != 202) {
            toast.error(`Status ${res.status} : ${res.statusText}\n ${await res.text()}`)
        } else {
            await reloadCompanies();
            toast.success(`${res.status} : ${res.statusText} | Sell one ${ICAO} for ${cmpICAO}`);
        }
    }

    // permet de charger les avions au démarage de la page
    useEffect(() => {
        const load = async () => {
            await reloadAircraft();

            await reloadCompanies();
        };

        load();
    }, [])

  return (
    <>
        <div className="container">
            <div className="item item-a" >
                <h2>Catalog</h2>
                <select
                    id="level"
                    value={companyFilter}
                    onChange={(e) => {
                        const constructor = e.target.value;
                        setCompanyFilter(constructor);

                        (async () => {
                            let res
                            if(constructor === "ALL") {
                                res = await fetch('https://${HOSTNAME}/avions');
                            } else {
                                res = await fetch(`https://${HOSTNAME}/avions?constructor=` + constructor);
                            }
                            const data: Aircraft[] = await res.json();
                            setCatalogueAircraft(data);
                        })();
                    }}
                >
                    {uniqueConstructors.map((constructor : string) => (
                        <option key={constructor} value={constructor}>
                            {constructor}
                        </option>
                    ))}
                </select>

                <div>
                    {catalogueAircraft.map((opt : Aircraft) => (
                        <div className={ selectedAircraftICAO == opt.ICAO ? 'catalog-item-selected' : 'catalog-item' } onClick={() =>{ handleSelectCard(opt.ICAO) } }>
                            <button className={"catalog-btn"} onClick={ () =>  deleteAircraft(opt.ICAO)} > DEL </button>
                            <strong> {opt?.constructor} | {opt?.ICAO} </strong> <br/>
                            0 km  <small className="highlight"> --------------------------o----------------- </small> {opt?.range} km<br/>
                            Capacity : {opt?.maxCapacity} people
                        </div>
                    ))}
                </div>
            </div>

            <div className="item item-b" >
                <h2>Company</h2>

                {companies.map(company => (

                    <div className="company-item" >
                        <h2> {company.name} </h2>

                        <div className="info-cmp" >
                            <p> <b>ICAO</b> : {company.companyICAO} </p>
                            <p> <b>FROM</b> : {company.country} </p>
                        </div>

                        <div className="fleet-container" >

                            {company.fleet.map(item => (

                                <div className="card">
                                    <p> <b>{item.aircraftICAO}</b> </p>
                                    <p> Quantity : <b> {item.quantity} </b> </p>
                                    <div className="info-cmp" >
                                        <button onClick={ () => { buyAircraft(company.companyICAO, item.aircraftICAO) } }> Buy +1 </button>
                                        <button onClick={ () => { sellAircraft(company.companyICAO, item.aircraftICAO) } } > Sell -1 </button>
                                    </div>
                                </div>
                            ))}

                            <div className="card-add" onClick={ () => { buyAircraft(company.companyICAO, selectedAircraftICAO) } } >
                                BUY
                            </div>

                        </div>
                    </div>

                ))}
            </div>

            <div className="item item-c" >
                <h2>Post new aircraft</h2>

                <form onSubmit={(e) => {
                    e.preventDefault();      // stop le reload
                    postNewAircraft();       // ton fetch + toast
                }} >
                    <label className="form-title">Constructor</label>
                    <input
                        className="form"
                        type="text"
                        name="constructor"
                        value= {form.constructor}
                        onChange={handleChange}
                    />

                    <label className="form-title">ICAO</label>
                    <input
                        className="form"
                        type="text"
                        name="ICAO"
                        value= {form.ICAO}
                        onChange={handleChange}
                    />

                    <label className="form-title">Max Capacity</label>
                    <input
                        className="form"
                        type="number"
                        name="maxCapacity"
                        value= {form.maxCapacity}
                        onChange={handleChange}
                    />

                    <label className="form-title">Range</label>
                    <input
                        className="form"
                        type="number"
                        name="range"
                        value= {form.range}
                        onChange={handleChange}
                    />
                    <br/>
                    <button type="submit" className="form-button"> Post </button>
                </form>


            </div>
        </div>
    </>
  )
}

export default App

/*

      <h1>DAI Practical Work 3</h1>
      <div className="card">
          <button onClick={() => setCount((count) => count + 1)}>
             count is {count}
          </button>
          <button onClick={() => setCount((count) => count + 1)}>
              Delete ICAO
          </button>
      </div>

      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>

 */