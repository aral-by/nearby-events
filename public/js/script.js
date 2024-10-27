async function updateCities() {
    const countrySelect = document.getElementById('country');
    const citySelect = document.getElementById('city');
    const selectedCountry = countrySelect.value;

    // Şehir seçeneklerini temizle
    citySelect.innerHTML = '<option value="">Bir şehir seçin</option>';

    if (selectedCountry) {
        try {
            const response = await fetch(`/cities/${selectedCountry}`);
            const cities = await response.json();

            cities.forEach(city => {
                const option = document.createElement('option');
                option.value = city;
                option.textContent = city;
                citySelect.appendChild(option);
            });
        } catch (error) {
            console.error('Hata:', error);
        }
    }
}
