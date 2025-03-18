import React, {useState} from 'react';
interface SearchBarProps{
    onSearch:(query:String) => void;
}

const SearchBar:React.FC<SearchBarProps> = ({onSearch}) =>{
    const[query,setQuery] = useState('');

    const handleSearch = () => {
        onSearch(query);
    };

    return(
        <div className = 'search-bar'>
            <input
            type = "text"
            placeholder = "Search something about the tender"
            value = {query}
            onChange = {(e) => setQuery(e.target.value)}
            />
            <button onClick = {handleSearch}>Search</button>
        </div>
    );
};

export default SearchBar;