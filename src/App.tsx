import { Box, TextField, Typography, Button } from "@mui/material";
import { StaticDatePicker } from "@mui/x-date-pickers/StaticDatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import RotateRightIcon from "@mui/icons-material/RotateRight";
import { useState, useMemo, memo } from "react";
import { useMutation } from "@tanstack/react-query";
import getPeopleBirth from "./Service/peopleBirthService";
import StarRateIcon from "@mui/icons-material/StarRate";

interface BirthData {
  text: string;
  isFavourite: boolean;
}

interface Favourites {
  date: string;
  text: string;
}

const FavouritesList = memo(
  ({ favourites }: { favourites: Record<string, string[]> }) => (
    <Box component={"dl"}>
      {Object.entries(favourites).map(([date, texts], index) => (
        <Box key={index} className="my-6">
          <Typography component={"dt"} sx={{ fontWeight: 600 }} variant="body1">
            {date}
          </Typography>
          {texts.map((text, idx) => (
            <Typography key={idx} sx={{ mx: 4 }} component={"dd"}>
              {text}
            </Typography>
          ))}
        </Box>
      ))}
    </Box>
  )
);

const App = () => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [favourites, setFavourites] = useState<Favourites[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const mutation = useMutation({
    mutationFn: getPeopleBirth,
    mutationKey: ["getPeopleBirths"],
  });

  // ! Function to handle the date change when user click on any date in calendar
  const handleDateChange = (e: any) => {
    const formattedDate = new Intl.DateTimeFormat("en", {
      month: "long",
      day: "2-digit",
    }).format(new Date(e.$y, e.$M, e.$D));

    setSelectedDate(formattedDate);

    mutation.mutate({
      month: String(e.$M + 1).padStart(2, "0"),
      day: String(e.$D).padStart(2, "0"),
    });
  };

  // ! Function to handle the add to favourite list 
  const handleFavourites = (item: BirthData) => {
    if (item.isFavourite) {
      handleRemoveFavourite(item);
    } else {
      setFavourites((prevFavourites) => [
        ...prevFavourites,
        { date: selectedDate!, text: item.text },
      ]);
      if (mutation.data) {
        const updatedBirths = mutation.data.births.map((birthItem:any) =>
          birthItem.text === item.text
            ? { ...birthItem, isFavourite: true }
            : birthItem
        );
        mutation.data.births = updatedBirths;
      }
    }
  };

  // ! Function to remove the favourite birthday (if it exists in list) from the favourite birthday list
  const handleRemoveFavourite = (item: BirthData) => {
    setFavourites((prevFavourites) =>
      prevFavourites.filter((favourite) => favourite.text !== item.text)
    );
    if (mutation.data) {
      const updatedBirths = mutation.data.births.map((birthItem:any) =>
        birthItem.text === item.text
          ? { ...birthItem, isFavourite: false }
          : birthItem
      );
      mutation.data.births = updatedBirths;
    }
  };

  // ! Function To Group favourites by Date
  const groupedFavourites = useMemo(() => {
    return favourites.reduce<Record<string, string[]>>((acc, curr) => {
      (acc[curr.date] = acc[curr.date] || []).push(curr.text);
      return acc;
    }, {});
  }, [favourites]);

  // ! Function To Handle The Search Query
  const handleSearch = (e:any) => {
    setSearchQuery(e.target.value);
  };

  return (
    <Box className="h-screen p-4 lg:p-12 flex flex-col lg:flex-row lg:justify-between lg:gap-x-20">
      <Box className="w-full lg:w-1/2">
        {/* // ! Static Calendar Section */}
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <StaticDatePicker
            disableHighlightToday
            onChange={handleDateChange}
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
              bgcolor: "rgba(110,110,110,.3)",
              ":hover": { bgcolor: "rgba(110,110,110,.1)" },
              borderRadius: 90,
              boxShadow: "10px 10px 15px rgba(0,0,0,.6)",
            }}
            className="lg:max-w-md"
          />
        </LocalizationProvider>
        <Box className="w-full mt-20 text-center lg:text-start">
          <Typography sx={{ my: 2, fontWeight: 600 }} variant="h5">
            Birthdays on {selectedDate}
          </Typography>
          <TextField
            sx={{ my: 1, mx: 2 }}
            className='w-96 lg:w-80'
            type="text"
            id="peopleName"
            name="peopleName"
            disabled={mutation.data && mutation.data.births ? false : true}
            label="Enter Search Text After Selecting Date"
            onChange={handleSearch}
          />
        </Box>
      </Box>
      <Box className='w-full lg:w-1/2'>
        {/* // ! List of birthdays according to the date selected in the calendar */}
        <Box
          sx={{ bgcolor: "black", color: "white" }}
          component={"ul"}
          className="mt-4 w-full bg-red-400 h-96
        overflow-auto rounded-3xl p-3"
        >
          {mutation.isIdle && (
            <Typography
              sx={{ fontWeight: 600, fontSize: 15, color: "red", mx: 2 }}
              variant="overline"
            >
              Date! Has Not Been Selected Yet
            </Typography>
          )}
          {mutation.isPending && (
            <Box sx={{ mx: 2 }} display="flex" alignItems="center">
              <RotateRightIcon className="animate-spin" />
              <Typography sx={{ ml: 1, color: "white" }}>Loading...</Typography>
            </Box>
          )}
          {mutation.isSuccess && mutation.data?.births && (
            <Box sx={{ mx: 2 }} className="flex flex-col gap-y-2">
              {mutation.data.births
                .filter((item:any) =>
                  item.text.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((item: BirthData, index: number) => (
                  <Box
                    key={index}
                    component={"li"}
                    className="flex items-center gap-x-2"
                  >
                    <Button onClick={() => handleFavourites(item)}>
                      {item.isFavourite ? <StarRateIcon /> : <StarBorderIcon />}
                    </Button>
                    <Typography>{item.text}</Typography>
                  </Box>
                ))}
            </Box>
          )}
          {mutation.isError && (
            <Typography variant="overline">
              {(mutation.error as Error).message}
            </Typography>
          )}
        </Box>
        <Box className="w-full lg:w-1/2 mt-4 lg:mt-0  text-center lg:text-start">
          <Typography sx={{ mt: 2, mb: 1, fontWeight: 600 }} variant="h5">
            Favourite Birthdays
          </Typography>
          {!Object.keys(groupedFavourites).length ? (
            <Typography
              sx={{ fontWeight: 600, fontSize: 15, color: "red", mx: 2 }}
              variant="overline"
            >
              Favourite Birthdays List is Empty
            </Typography>
          ) : (
            // ! Favourite Birthday List
            <FavouritesList favourites={groupedFavourites} />
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default App;
